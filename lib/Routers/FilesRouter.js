"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FilesRouter = void 0;

var _express = _interopRequireDefault(require("express"));

var _bodyParser = _interopRequireDefault(require("body-parser"));

var Middlewares = _interopRequireWildcard(require("../middlewares"));

var _node = _interopRequireDefault(require("parse/node"));

var _Config = _interopRequireDefault(require("../Config"));

var _mime = _interopRequireDefault(require("mime"));

var _logger = _interopRequireDefault(require("../logger"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const triggers = require('../triggers');

const http = require('http');

const downloadFileFromURI = uri => {
  return new Promise((res, rej) => {
    http.get(uri, response => {
      response.setDefaultEncoding('base64');
      let body = `data:${response.headers['content-type']};base64,`;
      response.on('data', data => body += data);
      response.on('end', () => res(body));
    }).on('error', e => {
      rej(`Error downloading file from ${uri}: ${e.message}`);
    });
  });
};

const addFileDataIfNeeded = async file => {
  if (file._source.format === 'uri') {
    const base64 = await downloadFileFromURI(file._source.uri);
    file._previousSave = file;
    file._data = base64;
    file._requestTask = null;
  }

  return file;
};

class FilesRouter {
  expressRouter({
    maxUploadSize = '20Mb'
  } = {}) {
    var router = _express.default.Router();

    router.get('/files/:appId/:filename', this.getHandler);
    router.get('/files/:appId/metadata/:filename', this.metadataHandler);
    router.post('/files', function (req, res, next) {
      next(new _node.default.Error(_node.default.Error.INVALID_FILE_NAME, 'Filename not provided.'));
    });
    router.post('/files/:filename', _bodyParser.default.raw({
      type: () => {
        return true;
      },
      limit: maxUploadSize
    }), // Allow uploads without Content-Type, or with any Content-Type.
    Middlewares.handleParseHeaders, this.createHandler);
    router.delete('/files/:filename', Middlewares.handleParseHeaders, Middlewares.enforceMasterKeyAccess, this.deleteHandler);
    return router;
  }

  getHandler(req, res) {
    const config = _Config.default.get(req.params.appId);

    const filesController = config.filesController;
    const filename = req.params.filename;

    const contentType = _mime.default.getType(filename);

    if (isFileStreamable(req, filesController)) {
      filesController.handleFileStream(config, filename, req, res, contentType).catch(() => {
        res.status(404);
        res.set('Content-Type', 'text/plain');
        res.end('File not found.');
      });
    } else {
      filesController.getFileData(config, filename).then(data => {
        res.status(200);
        res.set('Content-Type', contentType);
        res.set('Content-Length', data.length);
        res.end(data);
      }).catch(() => {
        res.status(404);
        res.set('Content-Type', 'text/plain');
        res.end('File not found.');
      });
    }
  }

  async createHandler(req, res, next) {
    const config = req.config;
    const user = req.auth.user;
    const isMaster = req.auth.isMaster;

    const isLinked = user && _node.default.AnonymousUtils.isLinked(user);

    if (!isMaster && !config.fileUpload.enableForAnonymousUser && isLinked) {
      next(new _node.default.Error(_node.default.Error.FILE_SAVE_ERROR, 'File upload by anonymous user is disabled.'));
      return;
    }

    if (!isMaster && !config.fileUpload.enableForAuthenticatedUser && !isLinked && user) {
      next(new _node.default.Error(_node.default.Error.FILE_SAVE_ERROR, 'File upload by authenticated user is disabled.'));
      return;
    }

    if (!isMaster && !config.fileUpload.enableForPublic && !user) {
      next(new _node.default.Error(_node.default.Error.FILE_SAVE_ERROR, 'File upload by public is disabled.'));
      return;
    }

    const filesController = config.filesController;
    const {
      filename
    } = req.params;
    const contentType = req.get('Content-type');

    if (!req.body || !req.body.length) {
      next(new _node.default.Error(_node.default.Error.FILE_SAVE_ERROR, 'Invalid file upload.'));
      return;
    }

    const error = filesController.validateFilename(filename);

    if (error) {
      next(error);
      return;
    }

    const base64 = req.body.toString('base64');
    const file = new _node.default.File(filename, {
      base64
    }, contentType);
    const {
      metadata = {},
      tags = {}
    } = req.fileData || {};
    file.setTags(tags);
    file.setMetadata(metadata);
    const fileSize = Buffer.byteLength(req.body);
    const fileObject = {
      file,
      fileSize
    };

    try {
      // run beforeSaveFile trigger
      const triggerResult = await triggers.maybeRunFileTrigger(triggers.Types.beforeSaveFile, fileObject, config, req.auth);
      let saveResult; // if a new ParseFile is returned check if it's an already saved file

      if (triggerResult instanceof _node.default.File) {
        fileObject.file = triggerResult;

        if (triggerResult.url()) {
          // set fileSize to null because we wont know how big it is here
          fileObject.fileSize = null;
          saveResult = {
            url: triggerResult.url(),
            name: triggerResult._name
          };
        }
      } // if the file returned by the trigger has already been saved skip saving anything


      if (!saveResult) {
        // if the ParseFile returned is type uri, download the file before saving it
        await addFileDataIfNeeded(fileObject.file); // update fileSize

        const bufferData = Buffer.from(fileObject.file._data, 'base64');
        fileObject.fileSize = Buffer.byteLength(bufferData); // save file

        const createFileResult = await filesController.createFile(config, fileObject.file._name, bufferData, fileObject.file._source.type, {
          tags: fileObject.file._tags,
          metadata: fileObject.file._metadata
        }); // update file with new data

        fileObject.file._name = createFileResult.name;
        fileObject.file._url = createFileResult.url;
        fileObject.file._requestTask = null;
        fileObject.file._previousSave = Promise.resolve(fileObject.file);
        saveResult = {
          url: createFileResult.url,
          name: createFileResult.name
        };
      } // run afterSaveFile trigger


      await triggers.maybeRunFileTrigger(triggers.Types.afterSaveFile, fileObject, config, req.auth);
      res.status(201);
      res.set('Location', saveResult.url);
      res.json(saveResult);
    } catch (e) {
      _logger.default.error('Error creating a file: ', e);

      const error = triggers.resolveError(e, {
        code: _node.default.Error.FILE_SAVE_ERROR,
        message: `Could not store file: ${fileObject.file._name}.`
      });
      next(error);
    }
  }

  async deleteHandler(req, res, next) {
    try {
      const {
        filesController
      } = req.config;
      const {
        filename
      } = req.params; // run beforeDeleteFile trigger

      const file = new _node.default.File(filename);
      file._url = filesController.adapter.getFileLocation(req.config, filename);
      const fileObject = {
        file,
        fileSize: null
      };
      await triggers.maybeRunFileTrigger(triggers.Types.beforeDeleteFile, fileObject, req.config, req.auth); // delete file

      await filesController.deleteFile(req.config, filename); // run afterDeleteFile trigger

      await triggers.maybeRunFileTrigger(triggers.Types.afterDeleteFile, fileObject, req.config, req.auth);
      res.status(200); // TODO: return useful JSON here?

      res.end();
    } catch (e) {
      _logger.default.error('Error deleting a file: ', e);

      const error = triggers.resolveError(e, {
        code: _node.default.Error.FILE_DELETE_ERROR,
        message: 'Could not delete file.'
      });
      next(error);
    }
  }

  async metadataHandler(req, res) {
    const config = _Config.default.get(req.params.appId);

    const {
      filesController
    } = config;
    const {
      filename
    } = req.params;

    try {
      const data = await filesController.getMetadata(filename);
      res.status(200);
      res.json(data);
    } catch (e) {
      res.status(200);
      res.json({});
    }
  }

}

exports.FilesRouter = FilesRouter;

function isFileStreamable(req, filesController) {
  return req.get('Range') && typeof filesController.adapter.handleFileStream === 'function';
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9Sb3V0ZXJzL0ZpbGVzUm91dGVyLmpzIl0sIm5hbWVzIjpbInRyaWdnZXJzIiwicmVxdWlyZSIsImh0dHAiLCJkb3dubG9hZEZpbGVGcm9tVVJJIiwidXJpIiwiUHJvbWlzZSIsInJlcyIsInJlaiIsImdldCIsInJlc3BvbnNlIiwic2V0RGVmYXVsdEVuY29kaW5nIiwiYm9keSIsImhlYWRlcnMiLCJvbiIsImRhdGEiLCJlIiwibWVzc2FnZSIsImFkZEZpbGVEYXRhSWZOZWVkZWQiLCJmaWxlIiwiX3NvdXJjZSIsImZvcm1hdCIsImJhc2U2NCIsIl9wcmV2aW91c1NhdmUiLCJfZGF0YSIsIl9yZXF1ZXN0VGFzayIsIkZpbGVzUm91dGVyIiwiZXhwcmVzc1JvdXRlciIsIm1heFVwbG9hZFNpemUiLCJyb3V0ZXIiLCJleHByZXNzIiwiUm91dGVyIiwiZ2V0SGFuZGxlciIsIm1ldGFkYXRhSGFuZGxlciIsInBvc3QiLCJyZXEiLCJuZXh0IiwiUGFyc2UiLCJFcnJvciIsIklOVkFMSURfRklMRV9OQU1FIiwiQm9keVBhcnNlciIsInJhdyIsInR5cGUiLCJsaW1pdCIsIk1pZGRsZXdhcmVzIiwiaGFuZGxlUGFyc2VIZWFkZXJzIiwiY3JlYXRlSGFuZGxlciIsImRlbGV0ZSIsImVuZm9yY2VNYXN0ZXJLZXlBY2Nlc3MiLCJkZWxldGVIYW5kbGVyIiwiY29uZmlnIiwiQ29uZmlnIiwicGFyYW1zIiwiYXBwSWQiLCJmaWxlc0NvbnRyb2xsZXIiLCJmaWxlbmFtZSIsImNvbnRlbnRUeXBlIiwibWltZSIsImdldFR5cGUiLCJpc0ZpbGVTdHJlYW1hYmxlIiwiaGFuZGxlRmlsZVN0cmVhbSIsImNhdGNoIiwic3RhdHVzIiwic2V0IiwiZW5kIiwiZ2V0RmlsZURhdGEiLCJ0aGVuIiwibGVuZ3RoIiwidXNlciIsImF1dGgiLCJpc01hc3RlciIsImlzTGlua2VkIiwiQW5vbnltb3VzVXRpbHMiLCJmaWxlVXBsb2FkIiwiZW5hYmxlRm9yQW5vbnltb3VzVXNlciIsIkZJTEVfU0FWRV9FUlJPUiIsImVuYWJsZUZvckF1dGhlbnRpY2F0ZWRVc2VyIiwiZW5hYmxlRm9yUHVibGljIiwiZXJyb3IiLCJ2YWxpZGF0ZUZpbGVuYW1lIiwidG9TdHJpbmciLCJGaWxlIiwibWV0YWRhdGEiLCJ0YWdzIiwiZmlsZURhdGEiLCJzZXRUYWdzIiwic2V0TWV0YWRhdGEiLCJmaWxlU2l6ZSIsIkJ1ZmZlciIsImJ5dGVMZW5ndGgiLCJmaWxlT2JqZWN0IiwidHJpZ2dlclJlc3VsdCIsIm1heWJlUnVuRmlsZVRyaWdnZXIiLCJUeXBlcyIsImJlZm9yZVNhdmVGaWxlIiwic2F2ZVJlc3VsdCIsInVybCIsIm5hbWUiLCJfbmFtZSIsImJ1ZmZlckRhdGEiLCJmcm9tIiwiY3JlYXRlRmlsZVJlc3VsdCIsImNyZWF0ZUZpbGUiLCJfdGFncyIsIl9tZXRhZGF0YSIsIl91cmwiLCJyZXNvbHZlIiwiYWZ0ZXJTYXZlRmlsZSIsImpzb24iLCJsb2dnZXIiLCJyZXNvbHZlRXJyb3IiLCJjb2RlIiwiYWRhcHRlciIsImdldEZpbGVMb2NhdGlvbiIsImJlZm9yZURlbGV0ZUZpbGUiLCJkZWxldGVGaWxlIiwiYWZ0ZXJEZWxldGVGaWxlIiwiRklMRV9ERUxFVEVfRVJST1IiLCJnZXRNZXRhZGF0YSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7OztBQUNBLE1BQU1BLFFBQVEsR0FBR0MsT0FBTyxDQUFDLGFBQUQsQ0FBeEI7O0FBQ0EsTUFBTUMsSUFBSSxHQUFHRCxPQUFPLENBQUMsTUFBRCxDQUFwQjs7QUFFQSxNQUFNRSxtQkFBbUIsR0FBR0MsR0FBRyxJQUFJO0FBQ2pDLFNBQU8sSUFBSUMsT0FBSixDQUFZLENBQUNDLEdBQUQsRUFBTUMsR0FBTixLQUFjO0FBQy9CTCxJQUFBQSxJQUFJLENBQ0RNLEdBREgsQ0FDT0osR0FEUCxFQUNZSyxRQUFRLElBQUk7QUFDcEJBLE1BQUFBLFFBQVEsQ0FBQ0Msa0JBQVQsQ0FBNEIs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U2pELGdCQUFULENBQTBCeEIsR0FBMUIsRUFBK0JtQixlQUEvQixFQUFnRDtBQUM5QyxTQUFPbkIsR0FBRyxDQUFDMUIsR0FBSixDQUFRLE9BQVIsS0FBb0IsT0FBTzZDLGVBQWUsQ0FBQzBELE9BQWhCLENBQXdCcEQsZ0JBQS9CLEtBQW9ELFVBQS9FO0FBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZXhwcmVzcyBmcm9tICdleHByZXNzJztcbmltcG9ydCBCb2R5UGFyc2VyIGZyb20gJ2JvZHktcGFyc2VyJztcbmltcG9ydCAqIGFzIE1pZGRsZXdhcmVzIGZyb20gJy4uL21pZGRsZXdhcmVzJztcbmltcG9ydCBQYXJzZSBmcm9tICdwYXJzZS9ub2RlJztcbmltcG9ydCBDb25maWcgZnJvbSAnLi4vQ29uZmlnJztcbmltcG9ydCBtaW1lIGZyb20gJ21pbWUnO1xuaW1wb3J0IGxvZ2dlciBmcm9tICcuLi9sb2dnZXInO1xuY29uc3QgdHJpZ2dlcnMgPSByZXF1aXJlKCcuLi90cmlnZ2VycycpO1xuY29uc3QgaHR0cCA9IHJlcXVpcmUoJ2h0dHAnKTtcblxuY29uc3QgZG93bmxvYWRGaWxlRnJvbVVSSSA9IHVyaSA9PiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICBodHRwXG4gICAgICAuZ2V0KHVyaSwgcmVzcG9uc2UgPT4ge1xuICAgICAgICByZXNwb25zZS5zZXREZWZhdWx0RW5jb2RpbmcoJ2Jhc2U2NCcpO1xuICAgICAgICBsZXQgYm9keSA9IGBkYXRhOiR7cmVzcG9uc2UuaGVhZGVyc1snY29udGVudC10eXBlJ119O2Jhc2U2NCxgO1xuICAgICAgICByZXNwb25zZS5vbignZGF0YScsIGRhdGEgPT4gKGJvZHkgKz0gZGF0YSkpO1xuICAgICAgICByZXNwb25zZS5vbignZW5kJywgKCkgPT4gcmVzKGJvZHkpKTtcbiAgICAgIH0pXG4gICAgICAub24oJ2Vycm9yJywgZSA9PiB7XG4gICAgICAgIHJlaihgRXJyb3IgZG93bmxvYWRpbmcgZmlsZSBmcm9tICR7dXJpfTogJHtlLm1lc3NhZ2V9YCk7XG4gICAgICB9KTtcbiAgfSk7XG59O1xuXG5jb25zdCBhZGRGaWxlRGF0YUlmTmVlZGVkID0gYXN5bmMgZmlsZSA9PiB7XG4gIGlmIChmaWxlLl9zb3VyY2UuZm9ybWF0ID09PSAndXJpJykge1xuICAgIGNvbnN0IGJhc2U2NCA9IGF3YWl0IGRvd25sb2FkRmlsZUZyb21VUkkoZmlsZS5fc291cmNlLnVyaSk7XG4gICAgZmlsZS5fcHJldmlvdXNTYXZlID0gZmlsZTtcbiAgICBmaWxlLl9kYXRhID0gYmFzZTY0O1xuICAgIGZpbGUuX3JlcXVlc3RUYXNrID0gbnVsbDtcbiAgfVxuICByZXR1cm4gZmlsZTtcbn07XG5cbmV4cG9ydCBjbGFzcyBGaWxlc1JvdXRlciB7XG4gIGV4cHJlc3NSb3V0ZXIoeyBtYXhVcGxvYWRTaXplID0gJzIwTWInIH0gPSB7fSkge1xuICAgIHZhciByb3V0ZXIgPSBleHByZXNzLlJvdXRlcigpO1xuICAgIHJvdXRlci5nZXQoJy9maWxlcy86YXBwSWQvOmZpbGVuYW1lJywgdGhpcy5nZXRIYW5kbGVyKTtcbiAgICByb3V0ZXIuZ2V0KCcvZmlsZXMvOmFwcElkL21ldGFkYXRhLzpmaWxlbmFtZScsIHRoaXMubWV0YWRhdGFIYW5kbGVyKTtcblxuICAgIHJvdXRlci5wb3N0KCcvZmlsZXMnLCBmdW5jdGlvbiAocmVxLCByZXMsIG5leHQpIHtcbiAgICAgIG5leHQobmV3IFBhcnNlLkVycm9yKFBhcnNlLkVycm9yLklOVkFMSURfRklMRV9OQU1FLCAnRmlsZW5hbWUgbm90IHByb3ZpZGVkLicpKTtcbiAgICB9KTtcblxuICAgIHJvdXRlci5wb3N0KFxuICAgICAgJy9maWxlcy86ZmlsZW5hbWUnLFxuICAgICAgQm9keVBhcnNlci5yYXcoe1xuICAgICAgICB0eXBlOiAoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sXG4gICAgICAgIGxpbWl0OiBtYXhVcGxvYWRTaXplLFxuICAgICAgfSksIC8vIEFsbG93IHVwbG9hZHMgd2l0aG91dCBDb250ZW50LVR5cGUsIG9yIHdpdGggYW55IENvbnRlbnQtVHlwZS5cbiAgICAgIE1pZGRsZXdhcmVzLmhhbmRsZVBhcnNlSGVhZGVycyxcbiAgICAgIHRoaXMuY3JlYXRlSGFuZGxlclxuICAgICk7XG5cbiAgICByb3V0ZXIuZGVsZXRlKFxuICAgICAgJy9maWxlcy86ZmlsZW5hbWUnLFxuICAgICAgTWlkZGxld2FyZXMuaGFuZGxlUGFyc2VIZWFkZXJzLFxuICAgICAgTWlkZGxld2FyZXMuZW5mb3JjZU1hc3RlcktleUFjY2VzcyxcbiAgICAgIHRoaXMuZGVsZXRlSGFuZGxlclxuICAgICk7XG4gICAgcmV0dXJuIHJvdXRlcjtcbiAgfVxuXG4gIGdldEhhbmRsZXIocmVxLCByZXMpIHtcbiAgICBjb25zdCBjb25maWcgPSBDb25maWcuZ2V0KHJlcS5wYXJhbXMuYXBwSWQpO1xuICAgIGNvbnN0IGZpbGVzQ29udHJvbGxlciA9IGNvbmZpZy5maWxlc0NvbnRyb2xsZXI7XG4gICAgY29uc3QgZmlsZW5hbWUgPSByZXEucGFyYW1zLmZpbGVuYW1lO1xuICAgIGNvbnN0IGNvbnRlbnRUeXBlID0gbWltZS5nZXRUeXBlKGZpbGVuYW1lKTtcbiAgICBpZiAoaXNGaWxlU3RyZWFtYWJsZShyZXEsIGZpbGVzQ29udHJvbGxlcikpIHtcbiAgICAgIGZpbGVzQ29udHJvbGxlci5oYW5kbGVGaWxlU3RyZWFtKGNvbmZpZywgZmlsZW5hbWUsIHJlcSwgcmVzLCBjb250ZW50VHlwZSkuY2F0Y2goKCkgPT4ge1xuICAgICAgICByZXMuc3RhdHVzKDQwNCk7XG4gICAgICAgIHJlcy5zZXQoJ0NvbnRlbnQtVHlwZScsICd0ZXh0L3BsYWluJyk7XG4gICAgICAgIHJlcy5lbmQoJ0ZpbGUgbm90IGZvdW5kLicpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZpbGVzQ29udHJvbGxlclxuICAgICAgICAuZ2V0RmlsZURhdGEoY29uZmlnLCBmaWxlbmFtZSlcbiAgICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgICAgcmVzLnN0YXR1cygyMDApO1xuICAgICAgICAgIHJlcy5zZXQoJ0NvbnRlbnQtVHlwZScsIGNvbnRlbnRUeXBlKTtcbiAgICAgICAgICByZXMuc2V0KCdDb250ZW50LUxlbmd0aCcsIGRhdGEubGVuZ3RoKTtcbiAgICAgICAgICByZXMuZW5kKGRhdGEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKCkgPT4ge1xuICAgICAgICAgIHJlcy5zdGF0dXMoNDA0KTtcbiAgICAgICAgICByZXMuc2V0KCdDb250ZW50LVR5cGUnLCAndGV4dC9wbGFpbicpO1xuICAgICAgICAgIHJlcy5lbmQoJ0ZpbGUgbm90IGZvdW5kLicpO1xuICAgICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBjcmVhdGVIYW5kbGVyKHJlcSwgcmVzLCBuZXh0KSB7XG4gICAgY29uc3QgY29uZmlnID0gcmVxLmNvbmZpZztcbiAgICBjb25zdCB1c2VyID0gcmVxLmF1dGgudXNlcjtcbiAgICBjb25zdCBpc01hc3RlciA9IHJlcS5hdXRoLmlzTWFzdGVyO1xuICAgIGNvbnN0IGlzTGlua2VkID0gdXNlciAmJiBQYXJzZS5Bbm9ueW1vdXNVdGlscy5pc0xpbmtlZCh1c2VyKTtcbiAgICBpZiAoIWlzTWFzdGVyICYmICFjb25maWcuZmlsZVVwbG9hZC5lbmFibGVGb3JBbm9ueW1vdXNVc2VyICYmIGlzTGlua2VkKSB7XG4gICAgICBuZXh0KFxuICAgICAgICBuZXcgUGFyc2UuRXJyb3IoUGFyc2UuRXJyb3IuRklMRV9TQVZFX0VSUk9SLCAnRmlsZSB1cGxvYWQgYnkgYW5vbnltb3VzIHVzZXIgaXMgZGlzYWJsZWQuJylcbiAgICAgICk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghaXNNYXN0ZXIgJiYgIWNvbmZpZy5maWxlVXBsb2FkLmVuYWJsZUZvckF1dGhlbnRpY2F0ZWRVc2VyICYmICFpc0xpbmtlZCAmJiB1c2VyKSB7XG4gICAgICBuZXh0KFxuICAgICAgICBuZXcgUGFyc2UuRXJyb3IoXG4gICAgICAgICAgUGFyc2UuRXJyb3IuRklMRV9TQVZFX0VSUk9SLFxuICAgICAgICAgICdGaWxlIHVwbG9hZCBieSBhdXRoZW50aWNhdGVkIHVzZXIgaXMgZGlzYWJsZWQuJ1xuICAgICAgICApXG4gICAgICApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIWlzTWFzdGVyICYmICFjb25maWcuZmlsZVVwbG9hZC5lbmFibGVGb3JQdWJsaWMgJiYgIXVzZXIpIHtcbiAgICAgIG5leHQobmV3IFBhcnNlLkVycm9yKFBhcnNlLkVycm9yLkZJTEVfU0FWRV9FUlJPUiwgJ0ZpbGUgdXBsb2FkIGJ5IHB1YmxpYyBpcyBkaXNhYmxlZC4nKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGZpbGVzQ29udHJvbGxlciA9IGNvbmZpZy5maWxlc0NvbnRyb2xsZXI7XG4gICAgY29uc3QgeyBmaWxlbmFtZSB9ID0gcmVxLnBhcmFtcztcbiAgICBjb25zdCBjb250ZW50VHlwZSA9IHJlcS5nZXQoJ0NvbnRlbnQtdHlwZScpO1xuXG4gICAgaWYgKCFyZXEuYm9keSB8fCAhcmVxLmJvZHkubGVuZ3RoKSB7XG4gICAgICBuZXh0KG5ldyBQYXJzZS5FcnJvcihQYXJzZS5FcnJvci5GSUxFX1NBVkVfRVJST1IsICdJbnZhbGlkIGZpbGUgdXBsb2FkLicpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBlcnJvciA9IGZpbGVzQ29udHJvbGxlci52YWxpZGF0ZUZpbGVuYW1lKGZpbGVuYW1lKTtcbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIG5leHQoZXJyb3IpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGJhc2U2NCA9IHJlcS5ib2R5LnRvU3RyaW5nKCdiYXNlNjQnKTtcbiAgICBjb25zdCBmaWxlID0gbmV3IFBhcnNlLkZpbGUoZmlsZW5hbWUsIHsgYmFzZTY0IH0sIGNvbnRlbnRUeXBlKTtcbiAgICBjb25zdCB7IG1ldGFkYXRhID0ge30sIHRhZ3MgPSB7fSB9ID0gcmVxLmZpbGVEYXRhIHx8IHt9O1xuICAgIGZpbGUuc2V0VGFncyh0YWdzKTtcbiAgICBmaWxlLnNldE1ldGFkYXRhKG1ldGFkYXRhKTtcbiAgICBjb25zdCBmaWxlU2l6ZSA9IEJ1ZmZlci5ieXRlTGVuZ3RoKHJlcS5ib2R5KTtcbiAgICBjb25zdCBmaWxlT2JqZWN0ID0geyBmaWxlLCBmaWxlU2l6ZSB9O1xuICAgIHRyeSB7XG4gICAgICAvLyBydW4gYmVmb3JlU2F2ZUZpbGUgdHJpZ2dlclxuICAgICAgY29uc3QgdHJpZ2dlclJlc3VsdCA9IGF3YWl0IHRyaWdnZXJzLm1heWJlUnVuRmlsZVRyaWdnZXIoXG4gICAgICAgIHRyaWdnZXJzLlR5cGVzLmJlZm9yZVNhdmVGaWxlLFxuICAgICAgICBmaWxlT2JqZWN0LFxuICAgICAgICBjb25maWcsXG4gICAgICAgIHJlcS5hdXRoXG4gICAgICApO1xuICAgICAgbGV0IHNhdmVSZXN1bHQ7XG4gICAgICAvLyBpZiBhIG5ldyBQYXJzZUZpbGUgaXMgcmV0dXJuZWQgY2hlY2sgaWYgaXQncyBhbiBhbHJlYWR5IHNhdmVkIGZpbGVcbiAgICAgIGlmICh0cmlnZ2VyUmVzdWx0IGluc3RhbmNlb2YgUGFyc2UuRmlsZSkge1xuICAgICAgICBmaWxlT2JqZWN0LmZpbGUgPSB0cmlnZ2VyUmVzdWx0O1xuICAgICAgICBpZiAodHJpZ2dlclJlc3VsdC51cmwoKSkge1xuICAgICAgICAgIC8vIHNldCBmaWxlU2l6ZSB0byBudWxsIGJlY2F1c2Ugd2Ugd29udCBrbm93IGhvdyBiaWcgaXQgaXMgaGVyZVxuICAgICAgICAgIGZpbGVPYmplY3QuZmlsZVNpemUgPSBudWxsO1xuICAgICAgICAgIHNhdmVSZXN1bHQgPSB7XG4gICAgICAgICAgICB1cmw6IHRyaWdnZXJSZXN1bHQudXJsKCksXG4gICAgICAgICAgICBuYW1lOiB0cmlnZ2VyUmVzdWx0Ll9uYW1lLFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIGlmIHRoZSBmaWxlIHJldHVybmVkIGJ5IHRoZSB0cmlnZ2VyIGhhcyBhbHJlYWR5IGJlZW4gc2F2ZWQgc2tpcCBzYXZpbmcgYW55dGhpbmdcbiAgICAgIGlmICghc2F2ZVJlc3VsdCkge1xuICAgICAgICAvLyBpZiB0aGUgUGFyc2VGaWxlIHJldHVybmVkIGlzIHR5cGUgdXJpLCBkb3dubG9hZCB0aGUgZmlsZSBiZWZvcmUgc2F2aW5nIGl0XG4gICAgICAgIGF3YWl0IGFkZEZpbGVEYXRhSWZOZWVkZWQoZmlsZU9iamVjdC5maWxlKTtcbiAgICAgICAgLy8gdXBkYXRlIGZpbGVTaXplXG4gICAgICAgIGNvbnN0IGJ1ZmZlckRhdGEgPSBCdWZmZXIuZnJvbShmaWxlT2JqZWN0LmZpbGUuX2RhdGEsICdiYXNlNjQnKTtcbiAgICAgICAgZmlsZU9iamVjdC5maWxlU2l6ZSA9IEJ1ZmZlci5ieXRlTGVuZ3RoKGJ1ZmZlckRhdGEpO1xuICAgICAgICAvLyBzYXZlIGZpbGVcbiAgICAgICAgY29uc3QgY3JlYXRlRmlsZVJlc3VsdCA9IGF3YWl0IGZpbGVzQ29udHJvbGxlci5jcmVhdGVGaWxlKFxuICAgICAgICAgIGNvbmZpZyxcbiAgICAgICAgICBmaWxlT2JqZWN0LmZpbGUuX25hbWUsXG4gICAgICAgICAgYnVmZmVyRGF0YSxcbiAgICAgICAgICBmaWxlT2JqZWN0LmZpbGUuX3NvdXJjZS50eXBlLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHRhZ3M6IGZpbGVPYmplY3QuZmlsZS5fdGFncyxcbiAgICAgICAgICAgIG1ldGFkYXRhOiBmaWxlT2JqZWN0LmZpbGUuX21ldGFkYXRhLFxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgICAgLy8gdXBkYXRlIGZpbGUgd2l0aCBuZXcgZGF0YVxuICAgICAgICBmaWxlT2JqZWN0LmZpbGUuX25hbWUgPSBjcmVhdGVGaWxlUmVzdWx0Lm5hbWU7XG4gICAgICAgIGZpbGVPYmplY3QuZmlsZS5fdXJsID0gY3JlYXRlRmlsZVJlc3VsdC51cmw7XG4gICAgICAgIGZpbGVPYmplY3QuZmlsZS5fcmVxdWVzdFRhc2sgPSBudWxsO1xuICAgICAgICBmaWxlT2JqZWN0LmZpbGUuX3ByZXZpb3VzU2F2ZSA9IFByb21pc2UucmVzb2x2ZShmaWxlT2JqZWN0LmZpbGUpO1xuICAgICAgICBzYXZlUmVzdWx0ID0ge1xuICAgICAgICAgIHVybDogY3JlYXRlRmlsZVJlc3VsdC51cmwsXG4gICAgICAgICAgbmFtZTogY3JlYXRlRmlsZVJlc3VsdC5uYW1lLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgLy8gcnVuIGFmdGVyU2F2ZUZpbGUgdHJpZ2dlclxuICAgICAgYXdhaXQgdHJpZ2dlcnMubWF5YmVSdW5GaWxlVHJpZ2dlcihcbiAgICAgICAgdHJpZ2dlcnMuVHlwZXMuYWZ0ZXJTYXZlRmlsZSxcbiAgICAgICAgZmlsZU9iamVjdCxcbiAgICAgICAgY29uZmlnLFxuICAgICAgICByZXEuYXV0aFxuICAgICAgKTtcbiAgICAgIHJlcy5zdGF0dXMoMjAxKTtcbiAgICAgIHJlcy5zZXQoJ0xvY2F0aW9uJywgc2F2ZVJlc3VsdC51cmwpO1xuICAgICAgcmVzLmpzb24oc2F2ZVJlc3VsdCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciBjcmVhdGluZyBhIGZpbGU6ICcsIGUpO1xuICAgICAgY29uc3QgZXJyb3IgPSB0cmlnZ2Vycy5yZXNvbHZlRXJyb3IoZSwge1xuICAgICAgICBjb2RlOiBQYXJzZS5FcnJvci5GSUxFX1NBVkVfRVJST1IsXG4gICAgICAgIG1lc3NhZ2U6IGBDb3VsZCBub3Qgc3RvcmUgZmlsZTogJHtmaWxlT2JqZWN0LmZpbGUuX25hbWV9LmAsXG4gICAgICB9KTtcbiAgICAgIG5leHQoZXJyb3IpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGRlbGV0ZUhhbmRsZXIocmVxLCByZXMsIG5leHQpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgeyBmaWxlc0NvbnRyb2xsZXIgfSA9IHJlcS5jb25maWc7XG4gICAgICBjb25zdCB7IGZpbGVuYW1lIH0gPSByZXEucGFyYW1zO1xuICAgICAgLy8gcnVuIGJlZm9yZURlbGV0ZUZpbGUgdHJpZ2dlclxuICAgICAgY29uc3QgZmlsZSA9IG5ldyBQYXJzZS5GaWxlKGZpbGVuYW1lKTtcbiAgICAgIGZpbGUuX3VybCA9IGZpbGVzQ29udHJvbGxlci5hZGFwdGVyLmdldEZpbGVMb2NhdGlvbihyZXEuY29uZmlnLCBmaWxlbmFtZSk7XG4gICAgICBjb25zdCBmaWxlT2JqZWN0ID0geyBmaWxlLCBmaWxlU2l6ZTogbnVsbCB9O1xuICAgICAgYXdhaXQgdHJpZ2dlcnMubWF5YmVSdW5GaWxlVHJpZ2dlcihcbiAgICAgICAgdHJpZ2dlcnMuVHlwZXMuYmVmb3JlRGVsZXRlRmlsZSxcbiAgICAgICAgZmlsZU9iamVjdCxcbiAgICAgICAgcmVxLmNvbmZpZyxcbiAgICAgICAgcmVxLmF1dGhcbiAgICAgICk7XG4gICAgICAvLyBkZWxldGUgZmlsZVxuICAgICAgYXdhaXQgZmlsZXNDb250cm9sbGVyLmRlbGV0ZUZpbGUocmVxLmNvbmZpZywgZmlsZW5hbWUpO1xuICAgICAgLy8gcnVuIGFmdGVyRGVsZXRlRmlsZSB0cmlnZ2VyXG4gICAgICBhd2FpdCB0cmlnZ2Vycy5tYXliZVJ1bkZpbGVUcmlnZ2VyKFxuICAgICAgICB0cmlnZ2Vycy5UeXBlcy5hZnRlckRlbGV0ZUZpbGUsXG4gICAgICAgIGZpbGVPYmplY3QsXG4gICAgICAgIHJlcS5jb25maWcsXG4gICAgICAgIHJlcS5hdXRoXG4gICAgICApO1xuICAgICAgcmVzLnN0YXR1cygyMDApO1xuICAgICAgLy8gVE9ETzogcmV0dXJuIHVzZWZ1bCBKU09OIGhlcmU/XG4gICAgICByZXMuZW5kKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciBkZWxldGluZyBhIGZpbGU6ICcsIGUpO1xuICAgICAgY29uc3QgZXJyb3IgPSB0cmlnZ2Vycy5yZXNvbHZlRXJyb3IoZSwge1xuICAgICAgICBjb2RlOiBQYXJzZS5FcnJvci5GSUxFX0RFTEVURV9FUlJPUixcbiAgICAgICAgbWVzc2FnZTogJ0NvdWxkIG5vdCBkZWxldGUgZmlsZS4nLFxuICAgICAgfSk7XG4gICAgICBuZXh0KGVycm9yKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBtZXRhZGF0YUhhbmRsZXIocmVxLCByZXMpIHtcbiAgICBjb25zdCBjb25maWcgPSBDb25maWcuZ2V0KHJlcS5wYXJhbXMuYXBwSWQpO1xuICAgIGNvbnN0IHsgZmlsZXNDb250cm9sbGVyIH0gPSBjb25maWc7XG4gICAgY29uc3QgeyBmaWxlbmFtZSB9ID0gcmVxLnBhcmFtcztcbiAgICB0cnkge1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGZpbGVzQ29udHJvbGxlci5nZXRNZXRhZGF0YShmaWxlbmFtZSk7XG4gICAgICByZXMuc3RhdHVzKDIwMCk7XG4gICAgICByZXMuanNvbihkYXRhKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXMuc3RhdHVzKDIwMCk7XG4gICAgICByZXMuanNvbih7fSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGlzRmlsZVN0cmVhbWFibGUocmVxLCBmaWxlc0NvbnRyb2xsZXIpIHtcbiAgcmV0dXJuIHJlcS5nZXQoJ1JhbmdlJykgJiYgdHlwZW9mIGZpbGVzQ29udHJvbGxlci5hZGFwdGVyLmhhbmRsZUZpbGVTdHJlYW0gPT09ICdmdW5jdGlvbic7XG59XG4iXX0=