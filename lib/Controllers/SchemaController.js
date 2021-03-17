"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.classNameIsValid = classNameIsValid;
exports.fieldNameIsValid = fieldNameIsValid;
exports.invalidClassNameMessage = invalidClassNameMessage;
exports.buildMergedSchemaObject = buildMergedSchemaObject;
exports.VolatileClassesSchemas = exports.convertSchemaToAdapterSchema = exports.defaultColumns = exports.systemClasses = exports.load = exports.SchemaController = exports.default = void 0;

var _StorageAdapter = require("../Adapters/Storage/StorageAdapter");

var _SchemaCache = _interopRequireDefault(require("../Adapters/Cache/SchemaCache"));

var _DatabaseController = _interopRequireDefault(require("./DatabaseController"));

var _Config = _interopRequireDefault(require("../Config"));

var _deepcopy = _interopRequireDefault(require("deepcopy"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

// This class handles schema validation, persistence, and modification.
//
// Each individual Schema object should be immutable. The helpers to
// do things with the Schema just return a new schema when the schema
// is changed.
//
// The canonical place to store this Schema is in the database itself,
// in a _SCHEMA collection. This is not the right way to do it for an
// open source framework, but it's backward compatible, so we're
// keeping it this way for now.
//
// In API-handling code, you should only use the Schema class via the
// DatabaseController. This will let us replace the schema logic for
// different databases.
// TODO: hide all schema logic inside the database adapter.
// -disable-next
const Parse = require('parse/node').Parse;

const defaultColumns = Object.freeze({
  // Contain the default columns for every parse object type (except _Join collection)
  _Default: {
    objectId: {
      type: 'String'
    },
    createdAt: {
      type: 'Date'
    },
    updatedAt: {
      type: 'Date'
    },
    ACL: {
      type: 'ACL'
    }
  },
  // The additional default columns for the _User collection (in addition to DefaultCols)
  _User: {
    username: {
      type: 'String'
    },
    password: {
      type: 'String'
    },
    email: {
      type: 'String'
    },
    emailVerified: {
      type: 'Boolean'
    },
    authData: {
      type: 'Object'
    }
  },
  // The additional default columns for the _Installation collection (in addition to DefaultCols)
  _Installation: {
    installationId: {
      type: 'String'
    },
    deviceToken: {
      type: 'String'
    },
    channels: {
      type: 'Array'
    },
    deviceType: {
      type: 'String'
    },
    pushType: {
      type: 'String'
    },
    GCMSenderId: {
      type: 'String'
    },
    timeZone: {
      type: 'String'
    },
    localeIdentifier: {
      type: 'String'
    },
    badge: {
      type: 'Number'
    },
    appVersion: {
      type: 'String'
    },
    appName: {
      type: 'String'
    },
    appIdentifier: {
      type: 'String'
    },
    parseVersion: {
      type: 'String'
    }
  },
  // The additional default columns for the _Role collection (in addition to DefaultCols)
  _Role: {
    name: {
      type: 'String'
    },
    users: {
      type: 'Relation',
      targetClass: '_User'
    },
    roles: {
      type: 'Relation',
      targetClass: '_Role'
    }
  },
  // The additional default columns for the _Session collection (in addition to DefaultCols)
  _Session: {
    restricted: {
      type: 'Boolean'
    },
    user: {
      type: 'Pointer',
      targetClass: '_User'
    },
    installationId: {
      type: 'String'
    },
    sessionToken: {
      type: 'String'
    },
    expiresAt: {
      type: 'Date'
    },
    createdWith: {
      type: 'Object'
    }
  },
  _Product: {
    productIdentifier: {
      type: 'String'
    },
    download: {
      type: 'File'
    },
    downloadName: {
      type: 'String'
    },
    icon: {
      type: 'File'
    },
    order: {
      type: 'Number'
    },
    title: {
      type: 'String'
    },
    subtitle: {
      type: 'String'
    }
  },
  _PushStatus: {
    pushTime: {
      type: 'String'
    },
    source: {
      type: 'String'
    },
    // rest or webui
    query: {
      type: 'String'
    },
    // the stringified JSON query
    payload: {
      type: 'String'
    },
    // the stringified JSON payload,
    title: {
      type: 'String'
    },
    expiry: {
      type: 'Number'
    },
    expiration_interval: {
      type: 'Number'
    },
    status: {
      type: 'String'
    },
    numSent: {
      type: 'Number'
    },
    numFailed: {
      type: 'Number'
    },
    pushHash: {
      type: 'String'
    },
    errorMessage: {
      type: 'Object'
    },
    sentPerType: {
      type: 'Object'
    },
    failedPerType: {
      type: 'Object'
    },
    sentPerUTCOffset: {
      type: 'Object'
    },
    failedPerUTCOffset: {
      type: 'Object'
    },
    count: {
      type: 'Number'
    } // tracks # of batches queued and pending

  },
  _JobStatus: {
    jobName: {
      type: 'String'
    },
    source: {
      type: 'String'
    },
    status: {
      type: 'String'
    },
    message: {
      type: 'String'
    },
    params: {
      type: 'Object'
    },
    // params received when calling the job
    finishedAt: {
      type: 'Date'
    }
  },
  _JobSchedule: {
    jobName: {
      type: 'String'
    },
    description: {
      type: 'String'
    },
    params: {
      type: 'String'
    },
    startAfter: {
      type: 'String'
    },
    daysOfWeek: {
      type: 'Array'
    },
    timeOfDay: {
      type: 'String'
    },
    lastRun: {
      type: 'Number'
    },
    repeatMinutes: {
      type: 'Number'
    }
  },
  _Hooks: {
    functionName: {
      type: 'String'
    },
    className: {
      type: 'String'
    },
    triggerName: {
      type: 'String'
    },
    url: {
      type: 'String'
    }
  },
  _GlobalConfig: {
    objectId: {
      type: 'String'
    },
    params: {
      type: 'Object'
    },
    masterKeyOnly: {
      type: 'Object'
    }
  },
  _GraphQLConfig: {
    objectId: {
      type: 'String'
    },
    config: {
      type: 'Object'
    }
  },
  _Audience: {
    objectId: {
      type: 'String'
    },
    name: {
      type: 'String'
    },
    query: {
      type: 'String'
    },
    //storing query as JSON string to prevent "Nested keys should not contain the '$' or '.' characters" error
    lastUsed: {
      type: 'Date'
    },
    timesUsed: {
      type: 'Number'
    }
  },
  _Idempotency: {
    reqId: {
      type: 'String'
    },
    expire: {
      type: 'Date'
    }
  }
});
exports.defaultColumns = defaultColumns;
const requiredColumns = Object.freeze({
  _Product: ['productIdentifier', 'icon', 'order', 'title', 'subtitle'],
  _Role: ['name', 'ACL']
});
const invalidColumns = ['length'];
const systemClasses = Object.freeze(['_User', '_Installation', '_Role', '_Session', '_Product', '_PushStatus', '_JobStatus', '_JobSchedule', '_Audience', '_Idempotency']);
exports.systemClasses = systemClasses;
const volatileClasses = Object.freeze(['_JobStatus', '_PushStatus', '_Hooks', '_GlobalConfig', '_GraphQLConfig', '_JobSchedule', '_Audience', '_Idempotency']); // Anything that start with role

const roleRegex = /^role:.*/; // Anything that starts with userField (allowed for protected fields only)

const protectedFieldsPointerRegex = /^userField:.*/; // * permission

const publicRegex = /^\*$/;
const authenticatedRegex = /^authenticated$/;
const requiresAuthenticationRegex = /^requiresAuthentication$/;
const clpPointerRegex = /^pointerFields$/; // regex for validating entities in protectedFields object

const protectedFieldsRegex = Object.freeze([protectedFieldsPointerRegex, publicRegex, authenticatedRegex, roleRegex]); // clp regex

const clpFieldsRegex = Object.freeze([clpPointerRegex, publicRegex, requiresAuthenticationRegex, roleRegex]);

function validatePermissionKey(key, userIdRegExp) {
  let matchesSome = false;

  for (const regEx of clpFieldsRegex) {
    if (key.match(regEx) !== null) {
      matchesSome = true;
      break;
    }
  } // userId depends on startup options so it's dynamic


  const valid = matchesSome || key.match(userIdRegExp) !== null;

  if (!valid) {
    throw new Parse.Error(Parse.Error.INVALID_JSON, `'${key}' is not a valid key for class level permissions`);
  }
}

function validateProtectedFieldsKey(key, userIdRegExp) {
  let matchesSome = false;

  for (const regEx of protectedFieldsRegex) {
    if (key.match(regEx) !== null) {
      matchesSome = true;
      break;
    }
  } // userId regex depends on launch options so it's dynamic


  const valid = matchesSome || key.match(userIdRegExp) !== null;

  if (!valid) {
    throw new Parse.Error(Parse.Error.INVALID_JSON, `'${key}' is not a valid key for class level permissions`);
  }
}

const CLPValidKeys = Object.freeze(['find', 'count', 'get', 'create', 'update', 'delete', 'addField', 'readUserFields', 'writeUserFields', 'protectedFields']); // validation before setting class-level permissions on collection

function validateCLP(perms, fields, userIdRegExp) {
  if (!perms) {
    return;
  }

  for (const operationKey in perms) {
    if (CLPValidKeys.indexOf(operationKey) == -1) {
      throw new Parse.Error(Parse.Error.INVALID_JSON, `${operationKey} is not a valid operation for class level permissions`);
    }

    const operation = perms[operationKey]; // proceed with next operationKey
    // throws when root fields are of wrong type

    validateCLPjson(operation, operationKey);

    if (operationKey === 'readUserFields' || operationKey === 'writeUserFields') {
      // validate grouped pointer permissions
      // must be an array with field names
      for (const fieldName of operation) {
        validatePointerPermission(fieldName, fields, operationKey);
      } // readUserFields and writerUserFields do not have nesdted fields
      // proceed with next operationKey


      continue;
    } // validate protected fields


    if (operationKey === 'protectedFields') {
      for (const entity in operation) {
        // throws on unexpected key
        validateProtectedFieldsKey(entity, userIdRegExp);
        const protectedFields = operation[entity];

        if (!Array.isArray(protectedFields)) {
          throw new Parse.Error(Parse.Error.INVALID_JSON, `'${protectedFields}' is not a valid value for protectedFields[${entity}] - expected an array.`);
        } // if the field is in form of array


        for (const field of protectedFields) {
          // do not alloow to protect default fields
          if (defaultColumns._Default[field]) {
            throw new Parse.Error(Parse.Error.INVALID_JSON, `Default field '${field}' can not be protected`);
          } // field should exist on collection


          if (!Object.prototype.hasOwnProperty.call(fields, field)) {
            throw new Parse.Error(Parse.Error.INVALID_JSON, `Field '${field}' in protectedFields:${entity} does not exist`);
          }
        }
      } // proceed with next operationKey


      continue;
    } // validate other fields
    // Entity can be:
    // "*" - Public,
    // "requiresAuthentication" - authenticated users,
    // "objectId" - _User id,
    // "role:rolename",
    // "pointerFields" - array of field names containing pointers to users


    for (const entity in operation) {
      // throws on unexpected key
      validatePermissionKey(entity, userIdRegExp); // entity can be either:
      // "pointerFields": string[]

      if (entity === 'pointerFields') {
        const pointerFields = operation[entity];

        if (Array.isArray(pointerFields)) {
          for (const pointerField of pointerFields) {
            validatePointerPermission(pointerField, fields, operation);
          }
        } else {
          throw new Parse.Error(Parse.Error.INVALID_JSON, `'${pointerFields}' is not a valid value for ${operationKey}[${entity}] - expected an array.`);
        } // proceed with next entity key


        continue;
      } // or [entity]: boolean


      const permit = operation[entity];

      if (permit !== true) {
        throw new Parse.Error(Parse.Error.INVALID_JSON, `'${permit}' is not a valid value for class level permissions ${operationKey}:${entity}:${permit}`);
      }
    }
  }
}

function validateCLPjson(operation, operationKey) {
  if (operationKey === 'readUserFields' || operationKey === 'writeUserFields') {
    if (!Array.isArray(operation)) {
      throw new Parse.Error(Parse.Error.INVALID_JSON, `'${operation}' is not a valid value for class level permissions ${operationKey} - must be an array`);
    }
  } else {
    if (typeof operation === 'object' && operation !== null) {
      // ok to proceed
      return;
    } else {
      throw new Parse.Error(Parse.Error.INVALID_JSON, `'${operation}' is not a valid value for class level permissions ${operationKey} - must be an object`);
    }
  }
}

function validatePointerPermission(fieldName, fields, operation) {
  // Uses collection schema to ensure the field is of type:
  // - Pointer<_User> (pointers)
  // - Array
  //
  //    It's not possible to enforce type on Array's items in schema
  //  so we accept any Array field, and later when applying permissions
  //  only items that are pointers to _User are considered.
  if (!(fields[fieldName] && (fields[fieldName].type == 'Pointer' && fields[fieldName].targetClass == '_User' || fields[fieldName].type == 'Array'))) {
    throw new Parse.Error(Parse.Error.INVALID_JSON, `'${fieldName}' is not a valid column for class level pointer permissions ${operation}`);
  }
}

const joinClassRegex = /^_Join:[A-Za-z0-9_]+:[A-Za-z0-9_]+/;
const classAndFieldRegex = /^[A-Za-z][A-Za-z0-9_]*$/;

function classNameIsValid(className) {
  // Valid classes must:
  return (// Be one of _User, _Installation, _Role, _Session OR
    systemClasses.indexOf(className) > -1 || // Be a join table OR
    joinClassRegex.test(className) || // Include only alpha-numeric and underscores, and not start with an underscore or number
    fieldNameIsValid(className, className)
  );
} // Valid fields must be alpha-numeric, and not start with an underscore or number
// must not be a reserved key


function fieldNameIsValid(fieldName, className) {
  if (className && className !== '_Hooks') {
    if (fieldName === 'className') {
      return false;
    }
  }

  return classAndFieldRegex.test(fieldName) && !invalidColumns.includes(fieldName);
} // Checks that it's not trying to clobber one of the default fields of the class.


function fieldNameIsValidForClass(fieldName, className) {
  if (!fieldNameIsValid(fieldName, className)) {
    return false;
  }

  if (defaultColumns._Default[fieldName]) {
    return false;
  }

  if (defaultColumns[className] && defaultColumns[className][fieldName]) {
    return false;
  }

  return true;
}

function invalidClassNameMessage(className) {
  return 'Invalid classname: ' + className + ', classnames can only have alphanumeric characters and _, and must start with an alpha character ';
}

const invalidJsonError = new Parse.Error(Parse.Error.INVALID_JSON, 'invalid JSON');
const validNonRelationOrPointerTypes = ['Number', 'String', 'Boolean', 'Date', 'Object', 'Array', 'GeoPoint', 'File', 'Bytes', 'Polygon']; // Returns an error suitable for throwing if the type is invalid

const fieldTypeIsInvalid = ({
  type,
  targetClass
}) => {
  if (['Pointer', 'Relation'].indexOf(type) >= 0) {
    if (!targetClass) {
      return new Parse.Error(135, `type ${type} needs a class name`);
    } else if (typeof targetClass !== 'string') {
      return invalidJsonError;
    } else if (!classNameIsValid(targetClass)) {
      return new Parse.Error(Parse.Error.INVALID_CLASS_NAME, invalidClassNameMessage(targetClass));
    } else {
      return undefined;
    }
  }

  if (typeof type !== 'string') {
    return invalidJsonError;
  }

  if (validNonRelationOrPointerTypes.indexOf(type) < 0) {
    return new Parse.Error(Parse.Error.INCORRECT_TYPE, `invalid field type: ${type}`);
  }

  return undefined;
};

const convertSchemaToAdapterSchema = schema => {
  schema = injectDefaultSchema(schema);
  delete schema.fields.ACL;
  schema.fields._rperm = {
    type: 'Array'
  };
  schema.fields._wperm = {
    type: 'Array'
  };

  if (schema.className === '_User') {
    delete schema.fields.password;
    schema.fields._hashed_password = {
      type: 'String'
    };
  }

  return schema;
};

exports.convertSchemaToAdapterSchema = convertSchemaToAdapterSchema;

const convertAdapterSchemaToParseSchema = (_ref) => {
  let schema = _extends({}, _ref);

  delete schema.fields._rperm;
  delete schema.fields._wperm;
  schema.fields.ACL = {
    type: 'ACL'
  };

  if (schema.className === '_User') {
    delete schema.fields.authData; //Auth data is implicit

    delete schema.fields._hashed_password;
    schema.fields.password = {
      type: 'String'
    };
  }

  if (schema.indexes && Object.keys(schema.indexes).length === 0) {
    delete schema.indexes;
  }

  return schema;
};

class SchemaData {
  constructor(allSchemas = [], protectedFields = {}) {
    this.__data = {};
    this.__protectedFields = protectedFields;
    allSchemas.forEach(schema => {
      if (volatileClasses.includes(schema.className)) {
        return;
      }

      Object.defineProperty(this, schema.className, {
        get: () => {
          if (!this.__data[schema.className]) {
            const data = {};
            data.fields = injectDefaultSchema(schema).fields;
            data.classLevelPermissions = (0, _deepcopy.default)(schema.classLevelPermissions);
            data.indexes = schema.indexes;
            const classProtectedFields = this.__protectedFields[schema.className];

            if (classProtectedFields) {
              for (const key in classProtectedFields) {
                const unq = new Set([...(data.classLevelPermissions.protectedFields[key] || []), ...classProtectedFields[key]]);
                data.classLevelPermissions.protectedFields[key] = Array.from(unq);
              }
            }

            this.__data[schema.className] = data;
          }

          return this.__data[schema.className];
        }
      });
    }); // Inject the in-memory classes

    volatileClasses.forEach(className => {
      Object.defineProperty(this, className, {
        get: () => {
          if (!this.__data[className]) {
            const schema = injectDefaultSchema({
              className,
              fields: {},
              classLevelPermissions: {}
            });
            const data = {};
            data.fields = schema.fields;
            data.classLevelPermissions = schema.classLevelPermissions;
            data.indexes = schema.indexes;
            this.__data[className] = data;
          }

          return this.__data[className];
        }
      });
    });
  }

}

const injectDefaultSchema = ({
  className,
  fields,
  classLevelPermissions,
  indexes
}) => {
  const defaultSchema = {
    className,
    fields: _objectSpread(_objectSpread(_objectSpread({}, defaultColumns._Default), defaultColumns[className] || {}), fields),
    classLevelPermissions
  };

  if (indexes && Object.keys(indexes).length !== 0) {
    defaultSchema.indexes = indexes;
  }

  return defaultSchema;
};

const _HooksSchema = {
  className: '_Hooks',
  fields: defaultColumns._Hooks
};
const _GlobalConfigSchema = {
  className: '_GlobalConfig',
  fields: defaultColumns._GlobalConfig
};
const _GraphQLConfigSchema = {
  className: '_GraphQLConfig',
  fields: defaultColumns._GraphQLConfig
};

const _PushStatusSchema = convertSchemaToAdapterSchema(injectDefaultSchema({
  className: '_PushStatus',
  fields: {},
  classLevelPermissions: {}
}));

const _JobStatusSchema = convertSchemaToAdapterSchema(injectDefaultSchema({
  className: '_JobStatus',
  fields: {},
  classLevelPermissions: {}
}));

const _JobScheduleSchema = convertSchemaToAdapterSchema(injectDefaultSchema({
  className: '_JobSchedule',
  fields: {},
  classLevelPermissions: {}
}));

const _AudienceSchema = convertSchemaToAdapterSchema(injectDefaultSchema({
  className: '_Audience',
  fields: defaultColumns._Audience,
  classLevelPermissions: {}
}));

const _IdempotencySchema = convertSchemaToAdapterSchema(injectDefaultSchema({
  className: '_Idempotency',
  fields: defaultColumns._Idempotency,
  classLevelPermissions: {}
}));

const VolatileClassesSchemas = [_HooksSchema, _JobStatusSchema, _JobScheduleSchema, _PushStatusSchema, _GlobalConfigSchema, _GraphQLConfigSchema, _AudienceSchema, _IdempotencySchema];
exports.VolatileClassesSchemas = VolatileClassesSchemas;

const dbTypeMatchesObjectType = (dbType, objectType) => {
  if (dbType.type !== objectType.type) return false;
  if (dbType.targetClass !== objectType.targetClass) return false;
  if (dbType === objectType.type) return true;
  if (dbType.type === objectType.type) return true;
  return false;
};

const typeToString = type => {
  if (typeof type === 'string') {
    return type;
  }

  if (type.targetClass) {
    return `${type.type}<${type.targetClass}>`;
  }

  return `${type.type}`;
}; // Stores the entire schema of the app in a weird hybrid format somewhere between
// the mongo format and the Parse format. Soon, this will all be Parse format.


class SchemaController {
  constructor(databaseAdapter) {
    this._dbAdapter = databaseAdapter;
    this.schemaData = new SchemaData(_SchemaCache.default.all(), this.protectedFields);
    this.protectedFields = _Config.default.get(Parse.applicationId).protectedFields;

    const customIds = _Config.default.get(Parse.applicationId).allowCustomObjectId;

    const customIdRegEx = /^.{1,}$/u; // 1+ chars

    const autoIdRegEx = /^[a-zA-Z0-9]{1,}$/;
    this.userIdRegEx = customIds ? customIdRegEx : autoIdRegEx;

    this._dbAdapter.watch(() => {
      this.reloadData({
        clearCache: true
      });
    });
  }

  reloadData(options = {
    clearCache: false
  }) {
    if (this.reloadDataPromise && !options.clearCache) {
      return this.reloadDataPromise;
    }

    this.reloadDataPromise = this.getAllClasses(options).then(allSchemas => {
      this.schemaData = new SchemaData(allSchemas, this.protectedFields);
      delete this.reloadDataPromise;
    }, err => {
      this.schemaData = new SchemaData();
      delete this.reloadDataPromise;
      throw err;
    }).then(() => {});
    return this.reloadDataPromise;
  }

  getAllClasses(options = {
    clearCache: false
  }) {
    if (options.clearCache) {
      return this.setAllClasses();
    }

    const cached = _SchemaCache.default.all();

    if (cached && cached.length) {
      return Promise.resolve(cached);
    }

    return this.setAllClasses();
  }

  setAllClasses() {
    return this._dbAdapter.getAllClasses().then(allSchemas => allSchemas.map(injectDefaultSchema)).then(allSchemas => {
      _SchemaCache.default.put(allSchemas);

      return allSchemas;
    });
  }

  getOneSchema(className, allowVolatileClasses = false, options = {
    clearCache: false
  }) {
    if (options.clearCache) {
      _SchemaCache.default.clear();
    }

    if (allowVolatileClasses && volatileClasses.indexOf(className) > -1) {
      const data = this.schemaData[className];
      return Promise.resolve({
        className,
        fields: data.fields,
        classLevelPermissions: data.classLevelPermissions,
        indexes: data.indexes
      });
    }

    const cached = _SchemaCache.default.get(className);

    if (cached && !options.clearCache) {
      return Promise.resolve(cached);
    }

    return this.setAllClasses().then(allSchemas => {
      const oneSchema = allSchemas.find(schema => schema.className === className);

      if (!oneSchema) {
        return Promise.reject(undefined);
      }

      return oneSchema;
    });
  } // Create a new class that includes the three default fields.
  // ACL is an implicit column that does not get an entry in the
  // _SCHEMAS database. Returns a promise that resolves with the
  // created schema, in mongo format.
  // on success, and rejects with an error on fail. Ensure you
  // have authorization (master key, or client class creation
  // enabled) before calling this function.


  async addClassIfNotExists(className, fields = {}, classLevelPermissions, indexes = {}) {
    var validationError = this.validateNewClass(className, fields, classLevelPermissions);

    if (validationError) {
      if (validationError instanceof Parse.Error) {
        return Promise.reject(validationError);
      } else if (validationError.code && validationError.error) {
        return Promise.reject(new Parse.Error(validationError.code, validationError.error));
      }

      return Promise.reject(validationError);
    }

    try {
      const adapterSchema = await this._dbAdapter.createClass(className, convertSchemaToAdapterSchema({
        fields,
        classLevelPermissions,
        indexes,
        className
      })); // TODO: Remove by updating schema cache directly

      await this.reloadData({
        clearCache: true
      });
      const parseSchema = convertAdapterSchemaToParseSchema(adapterSchema);
      return parseSchema;
    } catch (error) {
      if (error && error.code === Parse.Error.DUPLICATE_VALUE) {
        throw new Parse.Error(Parse.Error.INVALID_CLASS_NAME, `Class ${className} already exists.`);
      } else {
        throw error;
      }
    }
  }

  updateClass(className, submittedFields, classLevelPermissions, indexes, database) {
    return this.getOneSchema(className).then(schema => {
      const existingFields = schema.fields;
      Object.keys(submittedFields).forEach(name => {
        const field = submittedFields[name];

        if (existingFields[name] && field.__op !== 'Delete') {
          throw new Parse.Error(255, `Field ${name} exists, cannot update.`);
        }

        if (!existingFields[name] && field.__op === 'Delete') {
          throw new Parse.Error(255, `Field ${name} does not exist, cannot delete.`);
        }
      });
      delete existingFields._rperm;
      delete existingFields._wperm;
      const newSchema = buildMergedSchemaObject(existingFields, submittedFields);
      const defaultFields = defaultColumns[className] || defaultColumns._Default;
      const fullNewSchema = Object.assign({}, newSchema, defaultFields);
      const validationError = this.validateSchemaData(className, newSchema, classLevelPermissions, Object.keys(existingFields));

      if (validationError) {
        throw new Parse.Error(validationError.code, validationError.error);
      } // Finally we have checked to make sure the request is valid and we can start deleting fields.
      // Do all deletions first, then a single save to _SCHEMA collection to handle all additions.


      const deletedFields = [];
      const insertedFields = [];
      Object.keys(submittedFields).forEach(fieldName => {
        if (submittedFields[fieldName].__op === 'Delete') {
          deletedFields.push(fieldName);
        } else {
          insertedFields.push(fieldName);
        }
      });
      let deletePromise = Promise.resolve();

      if (deletedFields.length > 0) {
        deletePromise = this.deleteFields(deletedFields, className, database);
      }

      let enforceFields = [];
      return deletePromise // Delete Everything
      .then(() => this.reloadData({
        clearCache: true
      })) // Reload our Schema, so we have all the new values
      .then(() => {
        const promises = insertedFields.map(fieldName => {
          const type = submittedFields[fieldName];
          return this.enforceFieldExists(className, fieldName, type);
        });
        return Promise.all(promises);
      }).then(results => {
        enforceFields = results.filter(result => !!result);
        return this.setPermissions(className, classLevelPermissions, newSchema);
      }).then(() => this._dbAdapter.setIndexesWithSchemaFormat(className, indexes, schema.indexes, fullNewSchema)).then(() => this.reloadData({
        clearCache: true
      })) //TODO: Move this logic into the database adapter
      .then(() => {
        this.ensureFields(enforceFields);
        const schema = this.schemaData[className];
        const reloadedSchema = {
          className: className,
          fields: schema.fields,
          classLevelPermissions: schema.classLevelPermissions
        };

        if (schema.indexes && Object.keys(schema.indexes).length !== 0) {
          reloadedSchema.indexes = schema.indexes;
        }

        return reloadedSchema;
      });
    }).catch(error => {
      if (error === undefined) {
        throw new Parse.Error(Parse.Error.INVALID_CLASS_NAME, `Class ${className} does not exist.`);
      } else {
        throw error;
      }
    });
  } // Returns a promise that resolves successfully to the new schema
  // object or fails with a reason.


  enforceClassExists(className) {
    if (this.schemaData[className]) {
      return Promise.resolve(this);
    } // We don't have this class. Update the schema


    return (// The schema update succeeded. Reload the schema
      this.addClassIfNotExists(className).catch(() => {
        // The schema update failed. This can be okay - it might
        // have failed because there's a race condition and a different
        // client is making the exact same schema update that we want.
        // So just reload the schema.
        return this.reloadData({
          clearCache: true
        });
      }).then(() => {
        // Ensure that the schema now validates
        if (this.schemaData[className]) {
          return this;
        } else {
          throw new Parse.Error(Parse.Error.INVALID_JSON, `Failed to add ${className}`);
        }
      }).catch(() => {
        // The schema still doesn't validate. Give up
        throw new Parse.Error(Parse.Error.INVALID_JSON, 'schema class name does not revalidate');
      })
    );
  }

  validateNewClass(className, fields = {}, classLevelPermissions) {
    if (this.schemaData[className]) {
      throw new Parse.Error(Parse.Error.INVALID_CLASS_NAME, `Class ${className} already exists.`);
    }

    if (!classNameIsValid(className)) {
      return {
        code: Parse.Error.INVALID_CLASS_NAME,
        error: invalidClassNameMessage(className)
      };
    }

    return this.validateSchemaData(className, fields, classLevelPermissions, []);
  }

  validateSchemaData(className, fields, classLevelPermissions, existingFieldNames) {
    for (const fieldName in fields) {
      if (existingFieldNames.indexOf(fieldName) < 0) {
        if (!fieldNameIsValid(fieldName, className)) {
          return {
            code: Parse.Error.INVALID_KEY_NAME,
            error: 'invalid field name: ' + fieldName
          };
        }

        if (!fieldNameIsValidForClass(fieldName, className)) {
          return {
            code: 136,
            error: 'field ' + fieldName + ' cannot be added'
          };
        }

        const fieldType = fields[fieldName];
        const error = fieldTypeIsInvalid(fieldType);
        if (error) return {
          code: error.code,
          error: error.message
        };

        if (fieldType.defaultValue !== undefined) {
          let defaultValueType = getType(fieldType.defaultValue);

          if (typeof defaultValueType === 'string') {
            defaultValueType = {
              type: defaultValueType
            };
          } else if (typeof defaultValueType === 'object' && fieldType.type === 'Relation') {
            return {
              code: Parse.Error.INCORRECT_TYPE,
              error: `The 'default value' option is not applicable for ${typeToString(fieldType)}`
            };
          }

          if (!dbTypeMatchesObjectType(fieldType, defaultValueType)) {
            return {
              code: Parse.Error.INCORRECT_TYPE,
              error: `schema mismatch for ${className}.${fieldName} default value; expected ${typeToString(fieldType)} but got ${typeToString(defaultValueType)}`
            };
          }
        } else if (fieldType.required) {
          if (typeof fieldType === 'object' && fieldType.type === 'Relation') {
            return {
              code: Parse.Error.INCORRECT_TYPE,
              error: `The 'required' option is not applicable for ${typeToString(fieldType)}`
            };
          }
        }
      }
    }

    for (const fieldName in defaultColumns[className]) {
      fields[fieldName] = defaultColumns[className][fieldName];
    }

    const geoPoints = Object.keys(fields).filter(key => fields[key] && fields[key].type === 'GeoPoint');

    if (geoPoints.length > 1) {
      return {
        code: Parse.Error.INCORRECT_TYPE,
        error: 'currently, only one GeoPoint field may exist in an object. Adding ' + geoPoints[1] + ' when ' + geoPoints[0] + ' already exists.'
      };
    }

    validateCLP(classLevelPermissions, fields, this.userIdRegEx);
  } // Sets the Class-level permissions for a given className, which must exist.


  async setPermissions(className, perms, newSchema) {
    if (typeof perms === 'undefined') {
      return Promise.resolve();
    }

    validateCLP(perms, newSchema, this.userIdRegEx);
    await this._dbAdapter.setClassLevelPermissions(className, perms);

    const cached = _SchemaCache.default.get(className);

    if (cached) {
      cached.classLevelPermissions = perms;
    }
  } // Returns a promise that resolves successfully to the new schema
  // object if the provided className-fieldName-type tuple is valid.
  // The className must already be validated.
  // If 'freeze' is true, refuse to update the schema for this field.


  enforceFieldExists(className, fieldName, type) {
    if (fieldName.indexOf('.') > 0) {
      // subdocument key (x.y) => ok if x is of type 'object'
      fieldName = fieldName.split('.')[0];
      type = 'Object';
    }

    if (!fieldNameIsValid(fieldName, className)) {
      throw new Parse.Error(Parse.Error.INVALID_KEY_NAME, `Invalid field name: ${fieldName}.`);
    } // If someone tries to create a new field with null/undefined as the value, return;


    if (!type) {
      return undefined;
    }

    const expectedType = this.getExpectedType(className, fieldName);

    if (typeof type === 'string') {
      type = {
        type
      };
    }

    if (type.defaultValue !== undefined) {
      let defaultValueType = getType(type.defaultValue);

      if (typeof defaultValueType === 'string') {
        defaultValueType = {
          type: defaultValueType
        };
      }

      if (!dbTypeMatchesObjectType(type, defaultValueType)) {
        throw new Parse.Error(Parse.Error.INCORRECT_TYPE, `schema mismatch for ${className}.${fieldName} default value; expected ${typeToString(type)} but got ${typeToString(defaultValueType)}`);
      }
    }

    if (expectedType) {
      if (!dbTypeMatchesObjectType(expectedType, type)) {
        throw new Parse.Error(Parse.Error.INCORRECT_TYPE, `schema mismatch for ${className}.${fieldName}; expected ${typeToString(expectedType)} but got ${typeToString(type)}`);
      }

      return undefined;
    }

    return this._dbAdapter.addFieldIfNotExists(className, fieldName, type).catch(error => {
      if (error.code == Parse.Error.INCORRECT_TYPE) {
        // Make sure that we throw errors when it is appropriate to do so.
        throw error;
      } // The update failed. This can be okay - it might have been a race
      // condition where another client updated the schema in the same
      // way that we wanted to. So, just reload the schema


      return Promise.resolve();
    }).then(() => {
      return {
        className,
        fieldName,
        type
      };
    });
  }

  ensureFields(fields) {
    for (let i = 0; i < fields.length; i += 1) {
      const {
        className,
        fieldName
      } = fields[i];
      let {
        type
      } = fields[i];
      const expectedType = this.getExpectedType(className, fieldName);

      if (typeof type === 'string') {
        type = {
          type: type
        };
      }

      if (!expectedType || !dbTypeMatchesObjectType(expectedType, type)) {
        throw new Parse.Error(Parse.Error.INVALID_JSON, `Could not add field ${fieldName}`);
      }
    }
  } // maintain compatibility


  deleteField(fieldName, className, database) {
    return this.deleteFields([fieldName], className, database);
  } // Delete fields, and remove that data from all objects. This is intended
  // to remove unused fields, if other writers are writing objects that include
  // this field, the field may reappear. Returns a Promise that resolves with
  // no object on success, or rejects with { code, error } on failure.
  // Passing the database and prefix is necessary in order to drop relation collections
  // and remove fields from objects. Ideally the database would belong to
  // a database adapter and this function would close over it or access it via member.


  deleteFields(fieldNames, className, database) {
    if (!classNameIsValid(className)) {
      throw new Parse.Error(Parse.Error.INVALID_CLASS_NAME, invalidClassNameMessage(className));
    }

    fieldNames.forEach(fieldName => {
      if (!fieldNameIsValid(fieldName, className)) {
        throw new Parse.Error(Parse.Error.INVALID_KEY_NAME, `invalid field name: ${fieldName}`);
      } //Don't allow deleting the default fields.


      if (!fieldNameIsValidForClass(fieldName, className)) {
        throw new Parse.Error(136, `field ${fieldName} cannot be changed`);
      }
    });
    return this.getOneSchema(className, false, {
      clearCache: true
    }).catch(error => {
      if (error === undefined) {
        throw new Parse.Error(Parse.Error.INVALID_CLASS_NAME, `Class ${className} does not exist.`);
      } else {
        throw error;
      }
    }).then(schema => {
      fieldNames.forEach(fieldName => {
        if (!schema.fields[fieldName]) {
          throw new Parse.Error(255, `Field ${fieldName} does not exist, cannot delete.`);
        }
      });

      const schemaFields = _objectSpread({}, schema.fields);

      return database.adapter.deleteFields(className, schema, fieldNames).then(() => {
        return Promise.all(fieldNames.map(fieldName => {
          const field = schemaFields[fieldName];

          if (field && field.type === 'Relation') {
            //For relations, drop the _Join table
            return database.adapter.deleteClass(`_Join:${fieldName}:${className}`);
          }

          return Promise.resolve();
        }));
      });
    }).then(() => {
      _SchemaCache.default.clear();
    });
  } // Validates an object provided in REST format.
  // Returns a promise that resolves to the new schema if this object is
  // valid.


  async validateObject(className, object, query) {
    let geocount = 0;
    const schema = await this.enforceClassExists(className);
    const promises = [];

    for (const fieldName in object) {
      if (object[fieldName] && getType(object[fieldName]) === 'GeoPoint') {
        geocount++;
      }

      if (geocount > 1) {
        return Promise.reject(new Parse.Error(Parse.Error.INCORRECT_TYPE, 'there can only be one geopoint field in a class'));
      }
    }

    for (const fieldName in object) {
      if (object[fieldName] === undefined) {
        continue;
      }

      const expected = getType(object[fieldName]);

      if (!expected) {
        continue;
      }

      if (fieldName === 'ACL') {
        // Every object has ACL implicitly.
        continue;
      }

      promises.push(schema.enforceFieldExists(className, fieldName, expected));
    }

    const results = await Promise.all(promises);
    const enforceFields = results.filter(result => !!result);

    if (enforceFields.length !== 0) {
      // TODO: Remove by updating schema cache directly
      await this.reloadData({
        clearCache: true
      });
    }

    this.ensureFields(enforceFields);
    const promise = Promise.resolve(schema);
    return thenValidateRequiredColumns(promise, className, object, query);
  } // Validates that all the properties are set for the object


  validateRequiredColumns(className, object, query) {
    const columns = requiredColumns[className];

    if (!columns || columns.length == 0) {
      return Promise.resolve(this);
    }

    const missingColumns = columns.filter(function (column) {
      if (query && query.objectId) {
        if (object[column] && typeof object[column] === 'object') {
          // Trying to delete a required column
          return object[column].__op == 'Delete';
        } // Not trying to do anything there


        return false;
      }

      return !object[column];
    });

    if (missingColumns.length > 0) {
      throw new Parse.Error(Parse.Error.INCORRECT_TYPE, missingColumns[0] + ' is required.');
    }

    return Promise.resolve(this);
  }

  testPermissionsForClassName(className, aclGroup, operation) {
    return SchemaController.testPermissions(this.getClassLevelPermissions(className), aclGroup, operation);
  } // Tests that the class level permission let pass the operation for a given aclGroup


  static testPermissions(classPermissions, aclGroup, operation) {
    if (!classPermissions || !classPermissions[operation]) {
      return true;
    }

    const perms = classPermissions[operation];

    if (perms['*']) {
      return true;
    } // Check permissions against the aclGroup provided (array of userId/roles)


    if (aclGroup.some(acl => {
      return perms[acl] === true;
    })) {
      return true;
    }

    return false;
  } // Validates an operation passes class-level-permissions set in the schema


  static validatePermission(classPermissions, className, aclGroup, operation, action) {
    if (SchemaController.testPermissions(classPermissions, aclGroup, operation)) {
      return Promise.resolve();
    }

    if (!classPermissions || !classPermissions[operation]) {
      return true;
    }

    const perms = classPermissions[operation]; // If only for authenticated users
    // make sure we have an aclGroup

    if (perms['requiresAuthentication']) {
      // If aclGroup has * (public)
      if (!aclGroup || aclGroup.length == 0) {
        throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Permission denied, user needs to be authenticated.');
      } else if (aclGroup.indexOf('*') > -1 && aclGroup.length == 1) {
        throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Permission denied, user needs to be authenticated.');
      } // requiresAuthentication passed, just move forward
      // probably would be wise at some point to rename to 'authenticatedUser'


      return Promise.resolve();
    } // No matching CLP, let's check the Pointer permissions
    // And handle those later


    const permissionField = ['get', 'find', 'count'].indexOf(operation) > -1 ? 'readUserFields' : 'writeUserFields'; // Reject create when write lockdown

    if (permissionField == 'writeUserFields' && operation == 'create') {
      throw new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, `Permission denied for action ${operation} on class ${className}.`);
    } // Process the readUserFields later


    if (Array.isArray(classPermissions[permissionField]) && classPermissions[permissionField].length > 0) {
      return Promise.resolve();
    }

    const pointerFields = classPermissions[operation].pointerFields;

    if (Array.isArray(pointerFields) && pointerFields.length > 0) {
      // any op except 'addField as part of create' is ok.
      if (operation !== 'addField' || action === 'update') {
        // We can allow adding field on update flow only.
        return Promise.resolve();
      }
    }

    throw new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, `Permission denied for action ${operation} on class ${className}.`);
  } // Validates an operation passes class-level-permissions set in the schema


  validatePermission(className, aclGroup, operation, action) {
    return SchemaController.validatePermission(this.getClassLevelPermissions(className), className, aclGroup, operation, action);
  }

  getClassLevelPermissions(className) {
    return this.schemaData[className] && this.schemaData[className].classLevelPermissions;
  } // Returns the expected type for a className+key combination
  // or undefined if the schema is not set


  getExpectedType(className, fieldName) {
    if (this.schemaData[className]) {
      const expectedType = this.schemaData[className].fields[fieldName];
      return expectedType === 'map' ? 'Object' : expectedType;
    }

    return undefined;
  } // Checks if a given class is in the schema.


  hasClass(className) {
    if (this.schemaData[className]) {
      return Promise.resolve(true);
    }

    return this.reloadData().then(() => !!this.schemaData[className]);
  }

} // Returns a promise for a new Schema.


exports.SchemaController = exports.default = SchemaController;

const load = (dbAdapter, options) => {
  const schema = new SchemaController(dbAdapter);
  return schema.reloadData(options).then(() => schema);
}; // Builds a new schema (in schema API response format) out of an
// existing mongo schema + a schemas API put request. This response
// does not include the default fields, as it is intended to be passed
// to mongoSchemaFromFieldsAndClassName. No validation is done here, it
// is done in mongoSchemaFromFieldsAndClassName.


exports.load = load;

function buildMergedSchemaObject(existingFields, putRequest) {
  const newSchema = {}; // -disable-next

  const sysSchemaField = Object.keys(defaultColumns).indexOf(existingFields._id) === -1 ? [] : Object.keys(defaultColumns[existingFields._id]);

  for (const oldField in existingFields) {
    if (oldField !== '_id' && oldField !== 'ACL' && oldField !== 'updatedAt' && oldField !== 'createdAt' && oldField !== 'objectId') {
      if (sysSchemaField.length > 0 && sysSchemaField.indexOf(oldField) !== -1) {
        continue;
      }

      const fieldIsDeleted = putRequest[oldField] && putRequest[oldField].__op === 'Delete';

      if (!fieldIsDeleted) {
        newSchema[oldField] = existingFields[oldField];
      }
    }
  }

  for (const newField in putRequest) {
    if (newField !== 'objectId' && putRequest[newField].__op !== 'Delete') {
      if (sysSchemaField.length > 0 && sysSchemaField.indexOf(newField) !== -1) {
        continue;
      }

      newSchema[newField] = putRequest[newField];
    }
  }

  return newSchema;
} // Given a schema promise, construct another schema promise that
// validates this field once the schema loads.


function thenValidateRequiredColumns(schemaPromise, className, object, query) {
  return schemaPromise.then(schema => {
    return schema.validateRequiredColumns(className, object, query);
  });
} // Gets the type from a REST API formatted object, where 'type' is
// extended past javascript types to include the rest of the Parse
// type system.
// The output should be a valid schema value.
// TODO: ensure that this is compatible with the format used in Open DB


function getType(obj) {
  const type = typeof obj;

  switch (type) {
    case 'boolean':
      return 'Boolean';

    case 'string':
      return 'String';

    case 'number':
      return 'Number';

    case 'map':
    case 'object':
      if (!obj) {
        return undefined;
      }

      return getObjectType(obj);

    case 'function':
    case 'symbol':
    case 'undefined':
    default:
      throw 'bad obj: ' + obj;
  }
} // This gets the type for non-JSON types like pointers and files, but
// also gets the appropriate type for $ operators.
// Returns null if the type is unknown.


function getObjectType(obj) {
  if (obj instanceof Array) {
    return 'Array';
  }

  if (obj.__type) {
    switch (obj.__type) {
      case 'Pointer':
        if (obj.className) {
          return {
            type: 'Pointer',
            targetClass: obj.className
          };
        }

        break;

      case 'Relation':
        if (obj.className) {
          return {
            type: 'Relation',
            targetClass: obj.className
          };
        }

        break;

      case 'File':
        if (obj.name) {
          return 'File';
        }

        break;

      case 'Date':
        if (obj.iso) {
          return 'Date';
        }

        break;

      case 'GeoPoint':
        if (obj.latitude != null && obj.longitude != null) {
          return 'GeoPoint';
        }

        break;

      case 'Bytes':
        if (obj.base64) {
          return 'Bytes';
        }

        break;

      case 'Polygon':
        if (obj.coordinates) {
          return 'Polygon';
        }

        break;
    }

    throw new Parse.Error(Parse.Error.INCORRECT_TYPE, 'This is not a valid ' + obj.__type);
  }

  if (obj['$ne']) {
    return getObjectType(obj['$ne']);
  }

  if (obj.__op) {
    switch (obj.__op) {
      case 'Increment':
        return 'Number';

      case 'Delete':
        return null;

      case 'Add':
      case 'AddUnique':
      case 'Remove':
        return 'Array';

      case 'AddRelation':
      case 'RemoveRelation':
        return {
          type: 'Relation',
          targetClass: obj.objects[0].className
        };

      case 'Batch':
        return getObjectType(obj.ops[0]);

      default:
        throw 'unexpected op: ' + obj.__op;
    }
  }

  return 'Object';
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9Db250cm9sbGVycy9TY2hlbWFDb250cm9sbGVyLmpzIl0sIm5hbWVzIjpbIlBhcnNlIiwicmVxdWlyZSIsImRlZmF1bHRDb2x1bW5zIiwiT2JqZWN0IiwiZnJlZXplIiwiX0RlZmF1bHQiLCJvYmplY3RJZCIsInR5cGUiLCJjcmVhdGVkQXQiLCJ1cGRhdGVkQXQiLCJBQ0wiLCJfVXNlciIsInVzZXJuYW1lIiwicGFzc3dvcmQiLCJlbWFpbCIsImVtYWlsVmVyaWZpZWQiLCJhdXRoRGF0YSIsIl9JbnN0YWxsYXRpb24iLCJpbnN0YWxsYXRpb25JZCIsImRldmljZVRva2VuIiwiY2hhbm5lbHMiLCJkZXZpY2VUeXBlIiwicHVzaFR5cGUiLCJHQ01TZW5kZXJJZCIsInRpbWVab25lIiwibG9jYWxlSWRlbnRpZmllciIsImJhZGdlIiwiYXBwVmVyc2lvbiIsImFwcE5hbWUiLCJhcHBJZGVudGlmaWVyIiwicGFyc2VWZXJzaW9uIiwiX1JvbGUiLCJuYW1lIiwidXNlcnMiLCJ0YXJnZXRDbGFzcyIsInJvbGVzIiwiX1Nlc3Npb24iLCJyZXN0cmljdGVkIiwidXNlciIsInNlc3Npb25Ub2tlbiIsImV4cGlyZXNBdCIsImNyZWF0ZWRXaXRoIiwiX1Byb2R1Y3QiLCJwcm9kdWN0SWRlbnRpZmllciIsImRvd25sb2FkIiwiZG93bmxvYWROYW1lIiwiaWNvbiIsIm9yZGVyIiwidGl0bGUiLCJzdWJ0aXRsZSIsIl9QdXNoU3RhdHVzIiwicHVzaFRpbWUiLCJzb3VyY2UiLCJxdWVyeSIsInBheWxvYWQiLCJleHBpcnkiLCJleHBpcmF0aW9uX2ludGVydmFsIiwic3RhdHVzIiwibnVtU2VudCIsIm51bUZhaWxlZCIsInB1c2hIYXNoIiwiZXJyb3JNZXNzYWdlIiwic2VudFBlclR5cGUiLCJmYWlsZWRQZXJUeXBlIiwic2VudFBlclVUQ09mZnNldCIsImZhaWxlZFBlclVUQ09mZnNldCIsImNvdW50IiwiX0pvYlN0YXR1cyIsImpvYk5hbWUiLCJtZXNzYWdlIiwicGFyYW1zIiwiZmluaXNoZWRBdCIsIl9Kb2JTY2hlZHVsZSIsImRlc2NyaXB0aW9uIiwic3RhcnRBZnRlciIsImRheXNPZldlZWsiLCJ0aW1lT2ZEYXkiLCJsYXN0UnVuIiwicmVwZWF0TWludXRlcyIsIl9Ib29rcyIsImZ1bmN0aW9uTmFtZSIsImNsYXNzTmFtZSIsInRyaWdnZXJOYW1lIiwidXJsIiwiX0dsb2JhbENvbmZpZyIsIm1hc3RlcktleU9ubHkiLCJfR3JhcGhRTENvbmZpZyIsImNvbmZpZyIsIl9BdWRpZW5jZSIsImxhc3RVc2VkIiwidGltZXNVc2VkIiwiX0lkZW1wb3RlbmN5IiwicmVxSWQiLCJleHBpcmUiLCJyZXF1aXJlZENvbHVtbnMiLCJpbnZhbGlkQ29sdW1ucyIsInN5c3RlbUNsYXNzZXMiLCJ2b2xhdGlsZUNsYXNzZXMiLCJyb2xlUmVnZXgiLCJwcm90ZWN0ZWRGaWVsZHNQb2ludGVyUmVnZXgiLCJwdWJsaWNSZWdleCIsImF1dGhlbnRpY2F0ZWRSZWdleCIsInJlcXVpcmVzQXV0aGVudGljYXRpb25SZWdleCIsImNscFBvaW50ZXJSZWdleCIsInByb3RlY3RlZEZpZWxkc1JlZ2V4IiwiY2xwRmllbGRzUmVnZXgiLCJ2YWxpZGF0ZVBlcm1pc3Npb25LZXkiLCJrZXkiLCJ1c2VySWRSZWdFeHAiLCJtYXRjaGVzU29tZSIsInJlZ0V4IiwibWF0Y2giLCJ2YWxpZCIsIkVycm9yIiwiSU5WQUxJRF9KU09OIiwidmFsaWRhdGVQcm90ZWN0ZWRGaWVsZHNLZXkiLCJDTFBWYWxpZEtleXMiLCJ2YWxpZGF0ZUNMUCIsInBlcm1zIiwiZmllbGRzIiwib3BlcmF0aW9uS2V5IiwiaW5kZXhPZiIsIm9wZXJhdGlvbiIsInZhbGlkYXRlQ0xQanNvbiIsImZpZWxkTmFtZSIsInZhbGlkYXRlUG9pbnRlclBlcm1pc3Npb24iLCJlbnRpdHkiLCJwcm90ZWN0ZWRGaWVsZHMiLCJBcnJheSIsImlzQXJyYXkiLCJmaWVsZCIsInByb3RvdHlwZSIsImhhc093blByb3BlcnR5IiwiY2FsbCIsInBvaW50ZXJGaWVsZHMiLCJwb2ludGVyRmllbGQiLCJwZXJtaXQiLCJqb2luQ2xhc3NSZWdleCIsImNsYXNzQW5kRmllbGRSZWdleCIsImNsYXNzTmFtZUlzVmFsaWQiLCJ0ZXN0IiwiZmllbGROYW1lSXNWYWxpZCIsImluY2x1ZGVzIiwiZmllbGROYW1lSXNWYWxpZEZvckNsYXNzIiwiaW52YWxpZENsYXNzTmFtZU1lc3NhZ2UiLCJpbnZhbGlkSnNvbkVycm9yIiwidmFsaWROb25SZWxhdGlvbk9yUG9pbnRlclR5cGVzIiwiZmllbGRUeXBlSXNJbnZhbGlkIiwiSU5WQUxJRF9DTEFTU19OQU1FIiwidW5kZWZpbmVkIiwiSU5DT1JSRUNUX1RZUEUiLCJjb252ZXJ0U2NoZW1hVG9BZGFwdGVyU2NoZW1hIiwic2NoZW1hIiwiaW5qZWN0RGVmYXVsdFNjaGVtYSIsIl9ycGVybSIsIl93cGVybSIsIl9oYXNoZWRfcGFzc3dvcmQiLCJjb252ZXJ0QWRhcHRlclNjaGVtYVRvUGFyc2VTY2hlbWEiLCJpbmRleGVzIiwia2V5cyIsImxlbmd0aCIsIlNjaGVtYURhdGEiLCJjb25zdHJ1Y3RvciIsImFsbFNjaGVtYXMiLCJfX2RhdGEiLCJfX3Byb3RlY3RlZEZpZWxkcyIsImZvckVhY2giLCJkZWZpbmVQcm9wZXJ0eSIsImdldCIsImRhdGEiLCJjbGFzc0xldmVsUGVybWlzc2lvbnMiLCJjbGFzc1Byb3RlY3RlZEZpZWxkcyIsInVucSIsIlNldCIsImZyb20iLCJkZWZhdWx0U2NoZW1hIiwiX0hvb2tzU2NoZW1hIiwiX0dsb2JhbENvbmZpZ1NjaGVtYSIsIl9HcmFwaFFMQ29uZmlnU2NoZW1hIiwiX1B1c2hTdGF0dXNTY2hlbWEiLCJfSm9iU3RhdHVzU2NoZW1hIiwiX0pvYlNjaGVkdWxlU2NoZW1hIiwiX0F1ZGllbmNlU2NoZW1hIiwiX0lkZW1wb3RlbmN5U2NoZW1hIiwiVm9sYXRpbGVDbGFzc2VzU2NoZW1hcyIsImRiVHlwZU1hdGNoZXNPYmplY3RUeXBlIiwiZGJUeXBlIiwib2JqZWN0VHlwZSIsInR5cGVUb1N0cmluZyIsIlNjaGVtYUNvbnRyb2xsZXIiLCJkYXRhYmFzZUFkYXB0ZXIiLCJfZGJBZGFwdGVyIiwic2NoZW1hRGF0YSIsIlNjaGVtYUNhY2hlIiwiYWxsIiwiQ29uZmlnIiwiYXBwbGljYXRpb25JZCIsImN1c3RvbUlkcyIsImFsbG93Q3VzdG9tT2JqZWN0SWQiLCJjdXN0b21JZFJlZ0V4IiwiYXV0b0lkUmVnRXgiLCJ1c2VySWRSZWdFeCIsIndhdGNoIiwicmVsb2FkRGF0YSIsImNsZWFyQ2FjaGUiLCJvcHRpb25zIiwicmVsb2FkRGF0YVByb21pc2UiLCJnZXRBbGxDbGFzc2VzIiwidGhlbiIsImVyciIsInNldEFsbENsYXNzZXMiLCJjYWNoZWQiLCJQcm9taXNlIiwicmVzb2x2ZSIsIm1hcCIsInB1dCIsImdldE9uZVNjaGVtYSIsImFsbG93Vm9sYXRpbGVDbGFzc2VzIiwiY2xlYXIiLCJvbmVTY2hlbWEiLCJmaW5kIiwicmVqZWN0IiwiYWRkQ2xhc3NJZk5vdEV4aXN0cyIsInZhbGlkYXRpb25FcnJvciIsInZhbGlkYXRlTmV3Q2xhc3MiLCJjb2RlIiwiZXJyb3IiLCJhZGFwdGVyU2NoZW1hIiwiY3JlYXRlQ2xhc3MiLCJwYXJzZVNjaGVtYSIsIkRVUExJQ0FURV9WQUxVRSIsInVwZGF0ZUNsYXNzIiwic3VibWl0dGVkRmllbGRzIiwiZGF0YWJhc2UiLCJleGlzdGluZ0ZpZWxkcyIsIl9fb3AiLCJuZXdTY2hlbWEiLCJidWlsZE1lcmdlZFNjaGVtYU9iamVjdCIsImRlZmF1bHRGaWVsZHMiLCJmdWxsTmV3U2NoZW1hIiwiYXNzaWduIiwidmFsaWRhdGVTY2hlbWFEYXRhIiwiZGVsZXRlZEZpZWxkcyIsImluc2VydGVkRmllbGRzIiwicHVzaCIsImRlbGV0ZVByb21pc2UiLCJkZWxldGVGaWVsZHMiLCJlbmZvcmNlRmllbGRzIiwicHJvbWlzZXMiLCJlbmZvcmNlRmllbGRFeGlzdHMiLCJyZXN1bHRzIiwiZmlsdGVyIiwicmVzdWx0Iiwic2V0UGVybWlzc2lvbnMiLCJzZXRJbmRleGVzV2l0aFNjaGVtYUZvcm1hdCIsImVuc3VyZUZpZWxkcyIsInJlbG9hZGVkU2NoZW1hIiwiY2F0Y2giLCJlbmZvcmNlQ2xhc3NFeGlzdHMiLCJleGlzdGluZ0ZpZWxkTmFtZXMiLCJJTlZBTElEX0tFWV9OQU1FIiwiZmllbGRUeXBlIiwiZGVmYXVsdFZhbHVlIiwiZGVmYXVsdFZhbHVlVHlwZSIsImdldFR5cGUiLCJyZXF1aXJlZCIsImdlb1BvaW50cyIsInNldENsYXNzTGV2ZWxQZXJtaXNzaW9ucyIsInNwbGl0IiwiZXhwZWN0ZWRUeXBlIiwiZ2V0RXhwZWN0ZWRUeXBlIiwiYWRkRmllbGRJZk5vdEV4aXN0cyIsImkiLCJkZWxldGVGaWVsZCIsImZpZWxkTmFtZXMiLCJzY2hlbWFGaWVsZHMiLCJhZGFwdGVyIiwiZGVsZXRlQ2xhc3MiLCJ2YWxpZGF0ZU9iamVjdCIsIm9iamVjdCIsImdlb2NvdW50IiwiZXhwZWN0ZWQiLCJwcm9taXNlIiwidGhlblZhbGlkYXRlUmVxdWlyZWRDb2x1bW5zIiwidmFsaWRhdGVSZXF1aXJlZENvbHVtbnMiLCJjb2x1bW5zIiwibWlzc2luZ0NvbHVtbnMiLCJjb2x1bW4iLCJ0ZXN0UGVybWlzc2lvbnNGb3JDbGFzc05hbWUiLCJhY2xHcm91cCIsInRlc3RQZXJtaXNzaW9ucyIsImdldENsYXNzTGV2ZWxQZXJtaXNzaW9ucyIsImNsYXNzUGVybWlzc2lvbnMiLCJzb21lIiwiYWNsIiwidmFsaWRhdGVQZXJtaXNzaW9uIiwiYWN0aW9uIiwiT0JKRUNUX05PVF9GT1VORCIsInBlcm1pc3Npb25GaWVsZCIsIk9QRVJBVElPTl9GT1JCSURERU4iLCJoYXNDbGFzcyIsImxvYWQiLCJkYkFkYXB0ZXIiLCJwdXRSZXF1ZXN0Iiwic3lzU2NoZW1hRmllbGQiLCJfaWQiLCJvbGRGaWVsZCIsImZpZWxkSXNEZWxldGVkIiwibmV3RmllbGQiLCJzY2hlbWFQcm9taXNlIiwib2JqIiwiZ2V0T2JqZWN0VHlwZSIsIl9fdHlwZSIsImlzbyIsImxhdGl0dWRlIiwibG9uZ2l0dWRlIiwiYmFzZTY0IiwiY29vcmRpbmF0ZXMiLCJvYmplY3RzIiwib3BzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQWtCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQTs7Ozs7Ozs7Ozs7O0FBdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTUEsS0FBSyxHQUFHQyxPQUFPLENBQUMsWUFBRCxDQUFQLENBQXNCRCxLQUFwQzs7QUFlQSxNQUFNRSxjQUEwQyxHQUFHQyxNQUFNLENBQUNDLE1BQVAsQ0FBYztBQUMvRDtBQUNBQyxFQUFBQSxRQUFRLEVBQUU7QUFDUkMsSUFBQUEsUUFBUSxFQUFFO0FBQUVDLE1BQUFBLElBQUksRUFBRTtBQUFSLEtBREY7QUFFUkMsSUFBQUEsU0FBUyxFQUFFO0FBQUVELE1BQUFBLElBQUksRUFBRTtBQUFSLEtBRkg7QUFHUkUsSUFBQUEsU0FBUyxFQUFFO0FBQUVGLE1BQUFBLElBQUksRUFBRTtBQUFSLEtBSEg7QUFJUkcsSUFBQUEsR0FBRyxFQUFFO0FBQUVILE1BQUFBLElBQUksRUFBRTtBQUFSO0FBSkcsR0FGcUQ7QUFRL0Q7QUFDQUksRUFBQUEsS0FBSyxFQUFFO0FBQ0xDLElBQUFBLFFBQVEsRUFBRTtBQUFFTCxNQUFBQSxJQUFJLEVBQUU7QUFBUixLQURMO0FBRUxNLElBQUFBLFFBQVEsRUFBRTtBQUFFTixNQUFBQSxJQUFJLEVBQUU7QUFBUixLQUZMO0FBR0xPLElBQUFBLEtBQUssRUFBRTtBQUFFUCxNQUFBQSxJQUFJLEVBQUU7QUFBUixLQUhGO0FBSUxRLElBQUFBLGFBQWEsRUFBRTtBQUFFUixNQUFBQSxJQUFJLEVBQUU7QUFBUixLQUpWO0FBS0xTLElBQUFBLFFBQVEsRUFBRTtBQUFFVCxNQUFBQSxJQUFJLEVBQUU7QUFBUjtBQUxMLEdBVHdEO0FBZ0IvRDtBQUNBVSxFQUFBQSxhQUFhLEVBQUU7QUFDYkMsSUFBQUEsY0FBYyxFQUFFO0FBQUVYLE1BQUFBLElBQUksRUFBRTtBQUFSLEtBREg7QUFFYlksSUFBQUEsV0FBVyxFQUFFO0FBQUVaLE1BQUFBLElBQUksRUFBRTtBQUFSLEtBRkE7QUFHYmEsSUFBQUEsUUFBUSxFQUFFO0FBQUViLE1BQUFBLElBQUksRUFBRTtBQUFSLEtBSEc7QUFJYmMsSUFBQUEsVUFBVSxFQUFFO0FBQUVkLE1BQUFBLElBQUksRUFBRTtBQUFSLEtBSkM7QUFLYmUsSUFBQUEsUUFBUSxFQUFFO0FBQUVmLE1BQUFBLElBQUksRUFBRTtBQUFSLEtBTEc7QUFNYmdCLElBQUFBLFdBQVcsRUFBRTtBQUFFaEIsTUFBQUEsSUFBSSxFQUFFO0FBQVIsS0FOQTtBQU9iaUIsSUFBQUEsUUFBUSxFQUFFO0FBQUVqQixNQUFBQSxJQUFJLEVBQUU7QUFBUixLQVBHO0FBUWJrQixJQUFBQSxnQkFBZ0IsRUFBRTtBQUFFbEIsTUFBQUEsSUFBSSxFQUFFO0FBQVIsS0FSTDtBQVNibUIsSUFBQUEsS0FBSyxFQUFFO0FBQUVuQixNQUFBQSxJQUFJLEVBQUU7QUFBUixLQVRNO0FBVWJvQixJQUFBQSxVQUFVLEVBQUU7QUFBRXBCLE1BQUFBLElBQUksRUFBRTtBQUFSLEtBVkM7QUFXYnFCLElBQUFBLE9BQU8sRUFBRTtBQUFFckIsTUFBQUEsSUFBSSxFQUFFO0FBQVIsS0FYSTtBQVlic0IsSUFBQUEsYUFBYSxFQUFFO0FBQUV0QixNQUFBQSxJQUFJLEVBQUU7QUFBUixLQVpGO0FBYWJ1QixJQUFBQSxZQUFZLEVBQUU7QUFBRXZCLE1BQUFBLElBQUksRUFBRTtBQUFSO0FBYkQsR0FqQmdEO0FBZ0MvRDtBQUNBd0IsRUFBQUEsS0FBSyxFQUFFO0FBQ0xDLElBQUFBLElBQUksRUFBRTtBQUFFekIsTUFBQUEsSUFBSSxFQUFFO0FBQVIsS0FERDtBQUVMMEIsSUFBQUEsS0FBSyxFQUFFO0FBQUUxQixNQUFBQSxJQUFJLEVBQUUsVUFBUjtBQUFvQjJCLE1BQUFBLFdBQVcsRUFBRTtBQUFqQyxLQUZGO0FBR0xDLElBQUFBLEtBQUssRUFBRTtBQUFFNUIsTUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0IyQixNQUFBQSxXQUFXLEVBQUU7QUFBakM7QUFIRixHQWpDd0Q7QUFzQy9EO0FBQ0FFLEVBQUFBLFFBQVEsRUFBRTtBQUNSQyxJQUFBQSxVQUFVLEVBQUU7QUFBRTlCLE1BQUFBLElBQUksRUFBRTtBQUFSLEtBREo7QUFFUitCLElBQUFBLElBQUksRUFBRTtBQUFFL0IsTUFBQUEsSUFBSSxFQUFFLFNBQVI7QUFBbUIyQixNQUFBQSxXQUFXLEVBQUU7QUFBaEMsS0FGRTtBQUdSaEIsSUFBQUEsY0FBYyxFQUFFO0FBQUVYLE1BQUFBLElBQUksRUFBRTtBQUFSLEtBSFI7QUFJUmdDLElBQUFBLFlBQVksRUFBRTtBQUFFaEMsTUFBQUEsSUFBSSxFQUFFO0FBQVIsS0FKTjtBQUtSaUMsSUFBQUEsU0FBUyxFQUFFO0FBQUVqQyxNQUFBQSxJQUFJLEVBQUU7QUFBUixLQUxIO0FBTVJrQyxJQUFBQSxXQUFXLEVBQUU7QUFBRWxDLE1BQUFBLElBQUksRUFBRTtBQUFSO0FBTkwsR0F2Q3FEO0FBK0MvRG1DLEVBQUFBLFFBQVEsRUFBRTtBQUNSQyxJQUFBQSxpQkFBaUIsRUFBRTtBQUFFcEMsTUFBQUEsSUFBSSxFQUFFO0FBQVIsS0FEWDtBQUVScUMsSUFBQUEsUUFBUSxFQUFFO0FBQUVyQyxNQUFBQSxJQUFJLEVBQUU7QUFBUixLQUZGO0FBR1JzQyxJQUFBQSxZQUFZLEVBQUU7QUFBRXRDLE1BQUFBLElBQUksRUFBRTtBQUFSLEtBSE47QUFJUnVDLElBQUFBLElBQUksRUFBRTtBQUFFdkMsTUFBQUEsSUFBSSxFQUFFO0FBQVIsS0FKRTtBQUtSd0MsSUFBQUEsS0FBSyxFQUFFO0FBQUV4QyxNQUFBQSxJQUFJLEVBQUU7QUFBUixLQUxDO0FBTVJ5QyxJQUFBQSxLQUFLLEVBQUU7QUFBRXpDLE1BQUFBLElBQUksRUFBRTtBQUFSLEtBTkM7QUFPUjBDLElBQUFBLFFBQVEsRUFBRTtBQUFFMUMsTUFBQUEsSUFBSSxFQUFFO0FBQVI7QUFQRixHQS9DcUQ7QUF3RC9EMkMsRUFBQUEsV0FBVyxFQUFFO0FBQ1hDLElBQUFBLFFBQVEsRUFBRTtBQUFFNUMsTUFBQUEsSUFBSSxFQUFFO0FBQVIsS0FEQztBQUVYNkMsSUFBQUEsTUFBTSxFQUFFO0FBQUU3QyxNQUFBQSxJQUFJLEVBQUU7QUFBUixLQUZHO0FBRWlCO0FBQzVCOEMsSUFBQUEsS0FBSyxFQUFFO0FBQUU5QyxNQUFBQSxJQUFJLEVBQUU7QUFBUixLQUhJO0FBR2dCO0FBQzNCK0MsSUFBQUEsT0FBTyxFQUFFO0FBQUUvQyxNQUFBQSxJQUFJLEVBQUU7QUFBUixLQUpFO0FBSWtCO0FBQzdCeUMsSUFBQUEsS0FBSyxFQUFFO0FBQUV6QyxNQUFBQSxJQUFJLEVBQUU7QUFBUixLQUxJO0FBTVhnRCxJQUFBQSxNQUFNLEVBQUU7QUFBRWhELE1BQUFBLElBQUksRUFBRTtBQUFSLEtBTkc7QUFPWGlELElBQUFBLG1CQUFtQixFQUFFO0FBQUVqRCxNQUFBQSxJQUFJLEVBQUU7QUFBUixLQVBWO0FBUVhrRCxJQUFBQSxNQUFNLEVBQUU7QUFBRWxELE1BQUFBLElBQUksRUFBRTtBQUFSLEtBUkc7QUFTWG1ELElBQUFBLE9BQU8sRUFBRTtBQUFFbkQsTUFBQUEsSUFBSSxFQUFFO0FBQVIsS0FURTtBQVVYb0QsSUFBQUEsU0FBUyxFQUFFO0FBQUVwRCxNQUFBQSxJQUFJLEVBQUU7QUFBUixLQVZBO0FBV1hxRCxJQUFBQSxRQUFRLEVBQUU7QUFBRXJELE1BQUFBLElBQUksRUFBRTtBQUFSLEtBWEM7QUFZWHNELElBQUFBLFlBQVksRUFBRTtBQUFFdEQsTUFBQUEsSUFBSSxFQUFFO0FBQVIsS0FaSDtBQWFYdUQsSUFBQUEsV0FBVyxFQUFFO0FBQUV2RCxNQUFBQSxJQUFJLEVBQUU7QUFBUixLQWJGO0FBY1h3RCxJQUFBQSxhQUFhLEVBQUU7QUFBRXhELE1BQUFBLElBQUksRUFBRTtBQUFSLEtBZEo7QUFlWHlELElBQUFBLGdCQUFnQixFQUFFO0FBQUV6RCxNQUFBQSxJQUFJLEVBQUU7QUFBUixLQWZQO0FBZ0JYMEQsSUFBQUEsa0JBQWtCLEVBQUU7QUFBRTFELE1BQUFBLElBQUksRUFBRTtBQUFSLEtBaEJUO0FBaUJYMkQsSUFBQUEsS0FBSyxFQUFFO0FBQUUzRCxNQUFBQSxJQUFJLEVBQUU7QUFBUixLQWpCSSxDQWlCZ0I7O0FBakJoQixHQXhEa0Q7QUEyRS9ENEQsRUFBQUEsVUFBVSxFQUFFO0FBQ1ZDLElBQUFBLE9BQU8sRUFBRTtBQUFFN0QsTUFBQUEsSUFBSSxFQUFFO0FBQVIsS0FEQztBQUVWNkMsSUFBQUEsTUFBTSxFQUFFO0FBQUU3QyxNQUFBQSxJQUFJLEVBQUU7QUFBUixLQUZFO0FBR1ZrRCxJQUFBQSxNQUFNLEVBQUU7QUFBRWxELE1BQUFBLElBQUksRUFBRTtBQUFSLEtBSEU7QUFJVjhELElBQUFBLE9BQU8sRUFBRTtBQUFFOUQsTUFBQUEsSUFBSSxFQUFFO0FBQVIsS0FKQztBQUtWK0QsSUFBQUEsTUFBTSxFQUFFO0FBQUUvRCxNQUFBQSxJQUFJLEVBQUU7QUFBUixLQUxFO0FBS2tCO0FBQzVCZ0UsSUFBQUEsVUFBVSxFQUFFO0FBQUVoRSxNQUFBQSxJQUFJLEVBQUU7QUFBUjtBQU5GLEdBM0VtRDtBQW1GL0RpRSxFQUFBQSxZQUFZLEVBQUU7QUFDWkosSUFBQUEsT0FBTyxFQUFFO0FBQUU3RCxNQUFBQSxJQUFJLEVBQUU7QUFBUixLQURHO0FBRVprRSxJQUFBQSxXQUFXLEVBQUU7QUFBRWxFLE1BQUFBLElBQUksRUFBRTtBQUFSLEtBRkQ7QUFHWitELElBQUFBLE1BQU0sRUFBRTtBQUFFL0QsTUFBQUEsSUFBSSxFQUFFO0FBQVIsS0FISTtBQUlabUUsSUFBQUEsVUFBVSxFQUFFO0FBQUVuRSxNQUFBQSxJQUFJLEVBQUU7QUFBUixLQUpBO0FBS1pvRSxJQUFBQSxVQUFVLEVBQUU7QUFBRXBFLE1BQUFBLElBQUksRUFBRTtBQUFSLEtBTEE7QUFNWnFFLElBQUFBLFNBQVMsRUFBRTtBQUFFckUsTUFBQUEsSUFBSSxFQUFFO0FBQVIsS0FOQztBQU9ac0UsSUFBQUEsT0FBTyxFQUFFO0FBQUV0RSxNQUFBQSxJQUFJLEVBQUU7QUFBUixLQVBHO0FBUVp1RSxJQUFBQSxhQUFhLEVBQUU7QUFBRXZFLE1BQUFBLElBQUksRUFBRTtBQUFSO0FBUkgsR0FuRmlEO0FBNkYvRHdFLEVBQUFBLE1BQU0sRUFBRTtBQUNOQyxJQUFBQSxZQUFZLEVBQUU7QUFBRXpFLE1BQUFBLElBQUksRUFBRTtBQUFSLEtBRFI7QUFFTjBFLElBQUFBLFNBQVMsRUFBRTtBQUFFMUUsTUFBQUEsSUFBSSxFQUFFO0FBQVIsS0FGTDtBQUdOMkUsSUFBQUEsV0FBVyxFQUFFO0FBQUUzRSxNQUFBQSxJQUFJLEVBQUU7QUFBUixLQUhQO0FBSU40RSxJQUFBQSxHQUFHLEVBQUU7QUFBRTVFLE1BQUFBLElBQUksRUFBRTtBQUFSO0FBSkMsR0E3RnVEO0FBbUcvRDZFLEVBQUFBLGFBQWEsRUFBRTtBQUNiOUUsSUFBQUEsUUFBUSxFQUFFO0FBQUVDLE1BQUFBLElBQUksRUFBRTtBQUFSLEtBREc7QUFFYitELElBQUFBLE1BQU0sRUFBRTtBQUFFL0QsTUFBQUEsSUFBSSxFQUFFO0FBQVIsS0FGSztBQUdiOEUsSUFBQUEsYUFBYSxFQUFFO0FBQUU5RSxNQUFBQSxJQUFJLEVBQUU7QUFBUjtBQUhGLEdBbkdnRDtBQXdHL0QrRSxFQUFBQSxjQUFjLEVBQUU7QUFDZGhGLElBQUFBLFFBQVEsRUFBRTtBQUFFQyxNQUFBQSxJQUFJLEVBQUU7QUFBUixLQURJO0FBRWRnRixJQUFBQSxNQUFNLEVBQUU7QUFBRWhGLE1BQUFBLElBQUksRUFBRTtBQUFSO0FBRk0sR0F4RytDO0FBNEcvRGlGLEVBQUFBLFNBQVMsRUFBRTtBQUNUbEYsSUFBQUEsUUFBUSxFQUFFO0FBQUVDLE1BQUFBLElBQUksRUFBRTtBQUFSLEtBREQ7QUFFVHlCLElBQUFBLElBQUksRUFBRTtBQUFFekIsTUFBQUEsSUFBSSxFQUFFO0FBQVIsS0FGRztBQUdUOEMsSUFBQUEsS0FBSyxFQUFFO0FBQUU5QyxNQUFBQSxJQUFJLEVBQUU7QUFBUixLQUhFO0FBR2tCO0FBQzNCa0YsSUFBQUEsUUFBUSxFQUFFO0FBQUVsRixNQUFBQSxJQUFJLEVBQUU7QUFBUixLQUpEO0FBS1RtRixJQUFBQSxTQUFTLEVBQUU7QUFBRW5GLE1BQUFBLElBQUksRUFBRTtBQUFSO0FBTEYsR0E1R29EO0FBbUgvRG9GLEVBQUFBLFlBQVksRUFBRTtBQUNaQyxJQUFBQSxLQUFLLEVBQUU7QUFBRXJGLE1BQUFBLElBQUksRUFBRTtBQUFSLEtBREs7QUFFWnNGLElBQUFBLE1BQU0sRUFBRTtBQUFFdEYsTUFBQUEsSUFBSSxFQUFFO0FBQVI7QUFGSTtBQW5IaUQsQ0FBZCxDQUFuRDs7QUF5SEEsTUFBTXVGLGVBQWUsR0FBRzNGLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjO0FBQ3BDc0MsRUFBQUEsUUFBUSxFQUFFLENBQUMsbUJBQUQsRUFBc0IsTUFBdEIsRUFBOEIsT0FBOUIsRUFBdUMsT0FBdkMsRUFBZ0QsVUFBaEQsQ0FEMEI7QUFFcENYLEVBQUFBLEtBQUssRUFBRSxDQUFDLE1BQUQsRUFBUyxLQUFUO0FBRjZCLENBQWQsQ0FBeEI7QUFLQSxNQUFNZ0UsY0FBYyxHQUFHLENBQUMsUUFBRCxDQUF2QjtBQUVBLE1BQU1DLGFBQWEsR0FBRzdGLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjLENBQ2xDLE9BRGtDLEVBRWxDLGVBRmtDLEVBR2xDLE9BSGtDLEVBSWxDLFVBSmtDLEVBS2xDLFVBTGtDLEVBTWxDLGFBTmtDLEVBT2xDLFlBUGtDLEVBUWxDLGNBUmtDLEVBU2xDLFdBVGtDLEVBVWxDLGNBVmtDLENBQWQsQ0FBdEI7O0FBYUEsTUFBTTZGLGVBQWUsR0FBRzlGLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjLENBQ3BDLFlBRG9DLEVBRXBDLGFBRm9DLEVBR3BDLFFBSG9DLEVBSXBDLGVBSm9DLEVBS3BDLGdCQUxvQyxFQU1wQyxjQU5vQyxFQU9wQyxXQVBvQyxFQVFwQyxjQVJvQyxDQUFkLENBQXhCLEMsQ0FXQTs7QUFDQSxNQUFNOEYsU0FBUyxHQUFHLFVBQWxCLEMsQ0FDQTs7QUFDQSxNQUFNQywyQkFBMkIsR0FBRyxlQUFwQyxDLENBQ0E7O0FBQ0EsTUFBTUMsV0FBVyxHQUFHLE1BQXBCO0FBRUEsTUFBTUMsa0JBQWtCLEdBQUcsaUJBQTNCO0FBRUEsTUFBTUMsMkJBQTJCLEdBQUcsMEJBQXBDO0FBRUEsTUFBTUMsZUFBZSxHQUFHLGlCQUF4QixDLENBRUE7O0FBQ0EsTUFBTUMsb0JBQW9CLEdBQUdyRyxNQUFNLENBQUNDLE1BQVAsQ0FBYyxDQUN6QytGLDJCQUR5QyxFQUV6Q0MsV0FGeUMsRUFHekNDLGtCQUh5QyxFQUl6Q0gsU0FKeUMsQ0FBZCxDQUE3QixDLENBT0E7O0FBQ0EsTUFBTU8sY0FBYyxHQUFHdEcsTUFBTSxDQUFDQyxNQUFQLENBQWMsQ0FDbkNtRyxlQURtQyxFQUVuQ0gsV0FGbUMsRUFHbkNFLDJCQUhtQyxFQUluQ0osU0FKbUMsQ0FBZCxDQUF2Qjs7QUFPQSxTQUFTUSxxQkFBVCxDQUErQkMsR0FBL0IsRUFBb0NDLFlBQXBDLEVBQWtEO0FBQ2hELE1BQUlDLFdBQVcsR0FBRyxLQUFsQjs7QUFDQSxPQUFLLE1BQU1DLEtBQVgsSUFBb0JMLGNBQXBCLEVBQW9DO0FBQ2xDLFFBQUlFLEdBQUcsQ0FBQ0ksS0FBSixDQUFVRCxLQUFWLE1BQXFCLElBQXpCLEVBQStCO0FBQzdCRCxNQUFBQSxXQUFXLEdBQUcsSUFBZDtBQUNBO0FBQ0Q7QUFDRixHQVArQyxDQVNoRDs7O0FBQ0EsUUFBTUcsS0FBSyxHQUFHSCxXQUFXLElBQUlGLEdBQUcsQ0FBQ0ksS0FBSixDQUFVSCxZQUFWLE1BQTRCLElBQXpEOztBQUNBLE1BQUksQ0FBQ0ksS0FBTCxFQUFZO0FBQ1YsVUFBTSxJQUFJaEgsS0FBSyxDQUFDaUgsS0FBVixDQUNKakgsS0FBSyxDQUFDaUgsS0FBTixDQUFZQyxZQURSLEVBRUgsSUFBR1AsR0FBSSxrREFGSixDQUFOO0FBSUQ7QUFDRjs7QUFFRCxTQUFTUSwwQkFBVCxDQUFvQ1IsR0FBcEMsRUFBeUNDLFlBQXpDLEVBQXVEO0FBQ3JELE1BQUlDLFdBQVcsR0FBRyxLQUFsQjs7QUFDQSxPQUFLLE1BQU1DLEtBQVgsSUFBb0JOLG9CQUFwQixFQUEwQztBQUN4QyxRQUFJRyxHQUFHLENBQUNJLEtBQUosQ0FBVUQsS0FBVixNQUFxQixJQUF6QixFQUErQjtBQUM3QkQsTUFBQUEsV0FBVyxHQUFHLElBQWQ7QUFDQTtBQUNEO0FBQ0YsR0FQb0QsQ0FTckQ7OztBQUNBLFFBQU1HLEtBQUssR0FBR0gsV0FBVyxJQUFJRixHQUFHLENBQUNJLEtBQUosQ0FBVUgsWUFBVixNQUE0QixJQUF6RDs7QUFDQSxNQUFJLENBQUNJLEtBQUwsRUFBWTtBQUNWLFVBQU0sSUFBSWhILEtBQUssQ0FBQ2lILEtBQVYsQ0FDSmpILEtBQUssQ0FBQ2lILEtBQU4sQ0FBWUMsWUFEUixFQUVILElBQUdQLEdBQUksa0RBRkosQ0FBTjtBQUlEO0FBQ0Y7O0FBRUQsTUFBTVMsWUFBWSxHQUFHakgsTUFBTSxDQUFDQyxNQUFQLENBQWMsQ0FDakMsTUFEaUMsRUFFakMsT0FGaUMsRUFHakMsS0FIaUMsRUFJakMsUUFKaUMsRUFLakMsUUFMaUMsRUFNakMsUUFOaUMsRUFPakMsVUFQaUMsRUFRakMsZ0JBUmlDLEVBU2pDLGlCQVRpQyxFQVVqQyxpQkFWaUMsQ0FBZCxDQUFyQixDLENBYUE7O0FBQ0EsU0FBU2lILFdBQVQsQ0FBcUJDLEtBQXJCLEVBQW1EQyxNQUFuRCxFQUF5RVgsWUFBekUsRUFBK0Y7QUFDN0YsTUFBSSxDQUFDVSxLQUFMLEVBQVk7QUFDVjtBQUNEOztBQUNELE9BQUssTUFBTUUsWUFBWCxJQUEyQkYsS0FBM0IsRUFBa0M7QUFDaEMsUUFBSUYsWUFBWSxDQUFDSyxPQUFiLENBQXFCRCxZQUFyQixLQUFzQyxDQUFDLENBQTNDLEVBQThDO0FBQzVDLFlBQU0sSUFBSXhILEtBQUssQ0FBQ2lILEtBQVYsQ0FDSmpILEtBQUssQ0FBQ2lILEtBQU4sQ0FBWUMsWUFEUixFQUVILEdBQUVNLFlBQWEsdURBRlosQ0FBTjtBQUlEOztBQUVELFVBQU1FLFNBQVMsR0FBR0osS0FBSyxDQUFDRSxZQUFELENBQXZCLENBUmdDLENBU2hDO0FBRUE7O0FBQ0FHLElBQUFBLGVBQWUsQ0FBQ0QsU0FBRCxFQUFZRixZQUFaLENBQWY7O0FBRUEsUUFBSUEsWUFBWSxLQUFLLGdCQUFqQixJQUFxQ0EsWUFBWSxLQUFLLGlCQUExRCxFQUE2RTtBQUMzRTtBQUNBO0FBQ0EsV0FBSyxNQUFNSSxTQUFYLElBQXdCRixTQUF4QixFQUFtQztBQUNqQ0csUUFBQUEseUJBQXlCLENBQUNELFNBQUQsRUFBWUwsTUFBWixFQUFvQkMsWUFBcEIsQ0FBekI7QUFDRCxPQUwwRSxDQU0zRTtBQUNBOzs7QUFDQTtBQUNELEtBdkIrQixDQXlCaEM7OztBQUNBLFFBQUlBLFlBQVksS0FBSyxpQkFBckIsRUFBd0M7QUFDdEMsV0FBSyxNQUFNTSxNQUFYLElBQXFCSixTQUFyQixFQUFnQztBQUM5QjtBQUNBUCxRQUFBQSwwQkFBMEIsQ0FBQ1csTUFBRCxFQUFTbEIsWUFBVCxDQUExQjtBQUVBLGNBQU1tQixlQUFlLEdBQUdMLFNBQVMsQ0FBQ0ksTUFBRCxDQUFqQzs7QUFFQSxZQUFJLENBQUNFLEtBQUssQ0FBQ0MsT0FBTixDQUFjRixlQUFkLENBQUwsRUFBcUM7QUFDbkMsZ0JBQU0sSUFBSS9ILEtBQUssQ0FBQ2lILEtBQVYsQ0FDSmpILEtBQUssQ0FBQ2lILEtBQU4sQ0FBWUMsWUFEUixFQUVILElBQUdhLGVBQWdCLDhDQUE2Q0QsTUFBTyx3QkFGcEUsQ0FBTjtBQUlELFNBWDZCLENBYTlCOzs7QUFDQSxhQUFLLE1BQU1JLEtBQVgsSUFBb0JILGVBQXBCLEVBQXFDO0FBQ25DO0FBQ0EsY0FBSTdILGNBQWMsQ0FBQ0csUUFBZixDQUF3QjZILEtBQXhCLENBQUosRUFBb0M7QUFDbEMsa0JBQU0sSUFBSWxJLEtBQUssQ0FBQ2lILEtBQVYsQ0FDSmpILEtBQUssQ0FBQ2lILEtBQU4sQ0FBWUMsWUFEUixFQUVILGtCQUFpQmdCLEtBQU0sd0JBRnBCLENBQU47QUFJRCxXQVBrQyxDQVFuQzs7O0FBQ0EsY0FBSSxDQUFDL0gsTUFBTSxDQUFDZ0ksU0FBUCxDQUFpQkMsY0FBakIsQ0FBZ0NDLElBQWhDLENBQXFDZCxNQUFyQyxFQUE2Q1csS0FBN0MsQ0FBTCxFQUEwRDtBQUN4RCxrQkFBTSxJQUFJbEksS0FBSyxDQUFDaUgsS0FBVixDQUNKakgsS0FBSyxDQUFDaUgsS0FBTixDQUFZQyxZQURSLEVBRUgsVUFBU2dCLEtBQU0sd0JBQXVCSixNQUFPLGlCQUYxQyxDQUFOO0FBSUQ7QUFDRjtBQUNGLE9BL0JxQyxDQWdDdEM7OztBQUNBO0FBQ0QsS0E1RCtCLENBOERoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBQ0EsU0FBSyxNQUFNQSxNQUFYLElBQXFCSixTQUFyQixFQUFnQztBQUM5QjtBQUNBaEIsTUFBQUEscUJBQXFCLENBQUNvQixNQUFELEVBQVNsQixZQUFULENBQXJCLENBRjhCLENBSTlCO0FBQ0E7O0FBQ0EsVUFBSWtCLE1BQU0sS0FBSyxlQUFmLEVBQWdDO0FBQzlCLGNBQU1RLGFBQWEsR0FBR1osU0FBUyxDQUFDSSxNQUFELENBQS9COztBQUVBLFlBQUlFLEtBQUssQ0FBQ0MsT0FBTixDQUFjSyxhQUFkLENBQUosRUFBa0M7QUFDaEMsZUFBSyxNQUFNQyxZQUFYLElBQTJCRCxhQUEzQixFQUEwQztBQUN4Q1QsWUFBQUEseUJBQXlCLENBQUNVLFlBQUQsRUFBZWhCLE1BQWYsRUFBdUJHLFNBQXZCLENBQXpCO0FBQ0Q7QUFDRixTQUpELE1BSU87QUFDTCxnQkFBTSxJQUFJMUgsS0FBSyxDQUFDaUgsS0FBVixDQUNKakgsS0FBSyxDQUFDaUgsS0FBTixDQUFZQyxZQURSLEVBRUgsSUFBR29CLGFBQWMsOEJBQTZCZCxZQUFhLElBQUdNLE1BQU8sd0JBRmxFLENBQU47QUFJRCxTQVo2QixDQWE5Qjs7O0FBQ0E7QUFDRCxPQXJCNkIsQ0F1QjlCOzs7QUFDQSxZQUFNVSxNQUFNLEdBQUdkLFNBQVMsQ0FBQ0ksTUFBRCxDQUF4Qjs7QUFFQSxVQUFJVSxNQUFNLEtBQUssSUFBZixFQUFxQjtBQUNuQixjQUFNLElBQUl4SSxLQUFLLENBQUNpSCxLQUFWLENBQ0pqSCxLQUFLLENBQUNpSCxLQUFOLENBQVlDLFlBRFIsRUFFSCxJQUFHc0IsTUFBTyxzREFBcURoQixZQUFhLElBQUdNLE1BQU8sSUFBR1UsTUFBTyxFQUY3RixDQUFOO0FBSUQ7QUFDRjtBQUNGO0FBQ0Y7O0FBRUQsU0FBU2IsZUFBVCxDQUF5QkQsU0FBekIsRUFBeUNGLFlBQXpDLEVBQStEO0FBQzdELE1BQUlBLFlBQVksS0FBSyxnQkFBakIsSUFBcUNBLFlBQVksS0FBSyxpQkFBMUQsRUFBNkU7QUFDM0UsUUFBSSxDQUFDUSxLQUFLLENBQUNDLE9BQU4sQ0FBY1AsU0FBZCxDQUFMLEVBQStCO0FBQzdCLFlBQU0sSUFBSTFILEtBQUssQ0FBQ2lILEtBQVYsQ0FDSmpILEtBQUssQ0FBQ2lILEtBQU4sQ0FBWUMsWUFEUixFQUVILElBQUdRLFNBQVUsc0RBQXFERixZQUFhLHFCQUY1RSxDQUFOO0FBSUQ7QUFDRixHQVBELE1BT087QUFDTCxRQUFJLE9BQU9FLFNBQVAsS0FBcUIsUUFBckIsSUFBaUNBLFNBQVMsS0FBSyxJQUFuRCxFQUF5RDtBQUN2RDtBQUNBO0FBQ0QsS0FIRCxNQUdPO0FBQ0wsWUFBTSxJQUFJMUgsS0FBSyxDQUFDaUgsS0FBVixDQUNKakgsS0FBSyxDQUFDaUgsS0FBTixDQUFZQyxZQURSLEVBRUgsSUFBR1EsU0FBVSxzREFBcURGLFlBQWEsc0JBRjVFLENBQU47QUFJRDtBQUNGO0FBQ0Y7O0FBRUQsU0FBU0sseUJBQVQsQ0FBbUNELFNBQW5DLEVBQXNETCxNQUF0RCxFQUFzRUcsU0FBdEUsRUFBeUY7QUFDdkY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUNFLEVBQ0VILE1BQU0sQ0FBQ0ssU0FBRCxDQUFOLEtBQ0VMLE1BQU0sQ0FBQ0ssU0FBRCxDQUFOLENBQWtCckgsSUFBbEIsSUFBMEIsU0FBMUIsSUFBdUNnSCxNQUFNLENBQUNLLFNBQUQsQ0FBTixDQUFrQjFGLFdBQWxCLElBQWlDLE9BQXpFLElBQ0NxRixNQUFNLENBQUNLLFNBQUQsQ0FBTixDQUFrQnJILElBQWxCLElBQTBCLE9BRjVCLENBREYsQ0FERixFQU1FO0FBQ0EsVUFBTSxJQUFJUCxLQUFLLENBQUNpSCxLQUFWLENBQ0pqSCxLQUFLLENBQUNpSCxLQUFOLENBQVlDLFlBRFIsRUFFSCxJQUFHVSxTQUFVLCtEQUE4REYsU0FBVSxFQUZsRixDQUFOO0FBSUQ7QUFDRjs7QUFFRCxNQUFNZSxjQUFjLEdBQUcsb0NBQXZCO0FBQ0EsTUFBTUMsa0JBQWtCLEdBQUcseUJBQTNCOztBQUNBLFNBQVNDLGdCQUFULENBQTBCMUQsU0FBMUIsRUFBc0Q7QUFDcEQ7QUFDQSxTQUNFO0FBQ0FlLElBQUFBLGFBQWEsQ0FBQ3lCLE9BQWQsQ0FBc0J4QyxTQUF0QixJQUFtQyxDQUFDLENBQXBDLElBQ0E7QUFDQXdELElBQUFBLGNBQWMsQ0FBQ0csSUFBZixDQUFvQjNELFNBQXBCLENBRkEsSUFHQTtBQUNBNEQsSUFBQUEsZ0JBQWdCLENBQUM1RCxTQUFELEVBQVlBLFNBQVo7QUFObEI7QUFRRCxDLENBRUQ7QUFDQTs7O0FBQ0EsU0FBUzRELGdCQUFULENBQTBCakIsU0FBMUIsRUFBNkMzQyxTQUE3QyxFQUF5RTtBQUN2RSxNQUFJQSxTQUFTLElBQUlBLFNBQVMsS0FBSyxRQUEvQixFQUF5QztBQUN2QyxRQUFJMkMsU0FBUyxLQUFLLFdBQWxCLEVBQStCO0FBQzdCLGFBQU8sS0FBUDtBQUNEO0FBQ0Y7O0FBQ0QsU0FBT2Msa0JBQWtCLENBQUNFLElBQW5CLENBQXdCaEIsU0FBeEIsS0FBc0MsQ0FBQzdCLGNBQWMsQ0FBQytDLFFBQWYsQ0FBd0JsQixTQUF4QixDQUE5QztBQUNELEMsQ0FFRDs7O0FBQ0EsU0FBU21CLHdCQUFULENBQWtDbkIsU0FBbEMsRUFBcUQzQyxTQUFyRCxFQUFpRjtBQUMvRSxNQUFJLENBQUM0RCxnQkFBZ0IsQ0FBQ2pCLFNBQUQsRUFBWTNDLFNBQVosQ0FBckIsRUFBNkM7QUFDM0MsV0FBTyxLQUFQO0FBQ0Q7O0FBQ0QsTUFBSS9FLGNBQWMsQ0FBQ0csUUFBZixDQUF3QnVILFNBQXhCLENBQUosRUFBd0M7QUFDdEMsV0FBTyxLQUFQO0FBQ0Q7O0FBQ0QsTUFBSTFILGNBQWMsQ0FBQytFLFNBQUQsQ0FBZCxJQUE2Qi9FLGNBQWMsQ0FBQytFLFNBQUQsQ0FBZCxDQUEwQjJDLFNBQTFCLENBQWpDLEVBQXVFO0FBQ3JFLFdBQU8sS0FBUDtBQUNEOztBQUNELFNBQU8sSUFBUDtBQUNEOztBQUVELFNBQVNvQix1QkFBVCxDQUFpQy9ELFNBQWpDLEVBQTREO0FBQzFELFNBQ0Usd0JBQ0FBLFNBREEsR0FFQSxtR0FIRjtBQUtEOztBQUVELE1BQU1nRSxnQkFBZ0IsR0FBRyxJQUFJakosS0FBSyxDQUFDaUgsS0FBVixDQUFnQmpILEtBQUssQ0FBQ2lILEtBQU4sQ0FBWUMsWUFBNUIsRUFBMEMsY0FBMUMsQ0FBekI7QUFDQSxNQUFNZ0MsOEJBQThCLEdBQUcsQ0FDckMsUUFEcUMsRUFFckMsUUFGcUMsRUFHckMsU0FIcUMsRUFJckMsTUFKcUMsRUFLckMsUUFMcUMsRUFNckMsT0FOcUMsRUFPckMsVUFQcUMsRUFRckMsTUFScUMsRUFTckMsT0FUcUMsRUFVckMsU0FWcUMsQ0FBdkMsQyxDQVlBOztBQUNBLE1BQU1DLGtCQUFrQixHQUFHLENBQUM7QUFBRTVJLEVBQUFBLElBQUY7QUFBUTJCLEVBQUFBO0FBQVIsQ0FBRCxLQUEyQjtBQUNwRCxNQUFJLENBQUMsU0FBRCxFQUFZLFVBQVosRUFBd0J1RixPQUF4QixDQUFnQ2xILElBQWhDLEtBQXlDLENBQTdDLEVBQWdEO0FBQzlDLFFBQUksQ0FBQzJCLFdBQUwsRUFBa0I7QUFDaEIsYUFBTyxJQUFJbEMsS0FBSyxDQUFDaUgsS0FBVixDQUFnQixHQUFoQixFQUFzQixRQUFPMUcsSUFBSyxxQkFBbEMsQ0FBUDtBQUNELEtBRkQsTUFFTyxJQUFJLE9BQU8yQixXQUFQLEtBQXVCLFFBQTNCLEVBQXFDO0FBQzFDLGFBQU8rRyxnQkFBUDtBQUNELEtBRk0sTUFFQSxJQUFJLENBQUNOLGdCQUFnQixDQUFDekcsV0FBRCxDQUFyQixFQUFvQztBQUN6QyxhQUFPLElBQUlsQyxLQUFLLENBQUNpSCxLQUFWLENBQWdCakgsS0FBSyxDQUFDaUgsS0FBTixDQUFZbUMsa0JBQTVCLEVBQWdESix1QkFBdUIsQ0FBQzlHLFdBQUQsQ0FBdkUsQ0FBUDtBQUNELEtBRk0sTUFFQTtBQUNMLGFBQU9tSCxTQUFQO0FBQ0Q7QUFDRjs7QUFDRCxNQUFJLE9BQU85SSxJQUFQLEtBQWdCLFFBQXBCLEVBQThCO0FBQzVCLFdBQU8wSSxnQkFBUDtBQUNEOztBQUNELE1BQUlDLDhCQUE4QixDQUFDekIsT0FBL0IsQ0FBdUNsSCxJQUF2QyxJQUErQyxDQUFuRCxFQUFzRDtBQUNwRCxXQUFPLElBQUlQLEtBQUssQ0FBQ2lILEtBQVYsQ0FBZ0JqSCxLQUFLLENBQUNpSCxLQUFOLENBQVlxQyxjQUE1QixFQUE2Qyx1QkFBc0IvSSxJQUFLLEVBQXhFLENBQVA7QUFDRDs7QUFDRCxTQUFPOEksU0FBUDtBQUNELENBbkJEOztBQXFCQSxNQUFNRSw0QkFBNEIsR0FBSUMsTUFBRCxJQUFpQjtBQUNwREEsRUFBQUEsTUFBTSxHQUFHQyxtQkFBbUIsQ0FBQ0QsTUFBRCxDQUE1QjtBQUNBLFNBQU9BLE1BQU0sQ0FBQ2pDLE1BQVAsQ0FBYzdHLEdBQXJCO0FBQ0E4SSxFQUFBQSxNQUFNLENBQUNqQyxNQUFQLENBQWNtQyxNQUFkLEdBQXVCO0FBQUVuSixJQUFBQSxJQUFJLEVBQUU7QUFBUixHQUF2QjtBQUNBaUosRUFBQUEsTUFBTSxDQUFDakMsTUFBUCxDQUFjb0MsTUFBZCxHQUF1QjtBQUFFcEosSUFBQUEsSUFBSSxFQUFFO0FBQVIsR0FBdkI7O0FBRUEsTUFBSWlKLE1BQU0sQ0FBQ3ZFLFNBQVAsS0FBcUIsT0FBekIsRUFBa0M7QUFDaEMsV0FBT3VFLE1BQU0sQ0FBQ2pDLE1BQVAsQ0FBYzFHLFFBQXJCO0FBQ0EySSxJQUFBQSxNQUFNLENBQUNqQyxNQUFQLENBQWNxQyxnQkFBZCxHQUFpQztBQUFFckosTUFBQUEsSUFBSSxFQUFFO0FBQVIsS0FBakM7QUFDRDs7QUFFRCxTQUFPaUosTUFBUDtBQUNELENBWkQ7Ozs7QUFjQSxNQUFNSyxpQ0FBaUMsR0FBRyxVQUFtQjtBQUFBLE1BQWJMLE1BQWE7O0FBQzNELFNBQU9BLE1BQU0sQ0FBQ2pDLE1BQVAsQ0FBY21DLE1BQXJCO0FBQ0EsU0FBT0YsTUFBTSxDQUFDakMsTUFBUCxDQUFjb0MsTUFBckI7QUFFQUgsRUFBQUEsTUFBTSxDQUFDakMsTUFBUCxDQUFjN0csR0FBZCxHQUFvQjtBQUFFSCxJQUFBQSxJQUFJLEVBQUU7QUFBUixHQUFwQjs7QUFFQSxNQUFJaUosTUFBTSxDQUFDdkUsU0FBUCxLQUFxQixPQUF6QixFQUFrQztBQUNoQyxXQUFPdUUsTUFBTSxDQUFDakMsTUFBUCxDQUFjdkcsUUFBckIsQ0FEZ0MsQ0FDRDs7QUFDL0IsV0FBT3dJLE1BQU0sQ0FBQ2pDLE1BQVAsQ0FBY3FDLGdCQUFyQjtBQUNBSixJQUFBQSxNQUFNLENBQUNqQyxNQUFQLENBQWMxRyxRQUFkLEdBQXlCO0FBQUVOLE1BQUFBLElBQUksRUFBRTtBQUFSLEtBQXpCO0FBQ0Q7O0FBRUQsTUFBSWlKLE1BQU0sQ0FBQ00sT0FBUCxJQUFrQjNKLE1BQU0sQ0FBQzRKLElBQVAsQ0FBWVAsTUFBTSxDQUFDTSxPQUFuQixFQUE0QkUsTUFBNUIsS0FBdUMsQ0FBN0QsRUFBZ0U7QUFDOUQsV0FBT1IsTUFBTSxDQUFDTSxPQUFkO0FBQ0Q7O0FBRUQsU0FBT04sTUFBUDtBQUNELENBakJEOztBQW1CQSxNQUFNUyxVQUFOLENBQWlCO0FBR2ZDLEVBQUFBLFdBQVcsQ0FBQ0MsVUFBVSxHQUFHLEVBQWQsRUFBa0JwQyxlQUFlLEdBQUcsRUFBcEMsRUFBd0M7QUFDakQsU0FBS3FDLE1BQUwsR0FBYyxFQUFkO0FBQ0EsU0FBS0MsaUJBQUwsR0FBeUJ0QyxlQUF6QjtBQUNBb0MsSUFBQUEsVUFBVSxDQUFDRyxPQUFYLENBQW1CZCxNQUFNLElBQUk7QUFDM0IsVUFBSXZELGVBQWUsQ0FBQzZDLFFBQWhCLENBQXlCVSxNQUFNLENBQUN2RSxTQUFoQyxDQUFKLEVBQWdEO0FBQzlDO0FBQ0Q7O0FBQ0Q5RSxNQUFBQSxNQUFNLENBQUNvSyxjQUFQLENBQXNCLElBQXRCLEVBQTRCZixNQUFNLENBQUN2RSxTQUFuQyxFQUE4QztBQUM1Q3VGLFFBQUFBLEdBQUcsRUFBRSxNQUFNO0FBQ1QsY0FBSSxDQUFDLEtBQUtKLE1BQUwsQ0FBWVosTUFBTSxDQUFDdkUsU0FBbkIsQ0FBTCxFQUFvQztBQUNsQyxrQkFBTXdGLElBQUksR0FBRyxFQUFiO0FBQ0FBLFlBQUFBLElBQUksQ0FBQ2xELE1BQUwsR0FBY2tDLG1CQUFtQixDQUFDRCxNQUFELENBQW5CLENBQTRCakMsTUFBMUM7QUFDQWtELFlBQUFBLElBQUksQ0FBQ0MscUJBQUwsR0FBNkIsdUJBQVNsQixNQUFNLENBQUNrQixxQkFBaEIsQ0FBN0I7QUFDQUQsWUFBQUEsSUFBSSxDQUFDWCxPQUFMLEdBQWVOLE1BQU0sQ0FBQ00sT0FBdEI7QUFFQSxrQkFBTWEsb0JBQW9CLEdBQUcsS0FBS04saUJBQUwsQ0FBdUJiLE1BQU0sQ0FBQ3ZFLFNBQTlCLENBQTdCOztBQUNBLGdCQUFJMEYsb0JBQUosRUFBMEI7QUFDeEIsbUJBQUssTUFBTWhFLEdBQVgsSUFBa0JnRSxvQkFBbEIsRUFBd0M7QUFDdEMsc0JBQU1DLEdBQUcsR0FBRyxJQUFJQyxHQUFKLENBQVEsQ0FDbEIsSUFBSUosSUFBSSxDQUFDQyxxQkFBTCxDQUEyQjNDLGVBQTNCLENBQTJDcEIsR0FBM0MsS0FBbUQsRUFBdkQsQ0FEa0IsRUFFbEIsR0FBR2dFLG9CQUFvQixDQUFDaEUsR0FBRCxDQUZMLENBQVIsQ0FBWjtBQUlBOEQsZ0JBQUFBLElBQUksQ0FBQ0MscUJBQUwsQ0FBMkIzQyxlQUEzQixDQUEyQ3BCLEdBQTNDLElBQWtEcUIsS0FBSyxDQUFDOEMsSUFBTixDQUFXRixHQUFYLENBQWxEO0FBQ0Q7QUFDRjs7QUFFRCxpQkFBS1IsTUFBTCxDQUFZWixNQUFNLENBQUN2RSxTQUFuQixJQUFnQ3dGLElBQWhDO0FBQ0Q7O0FBQ0QsaUJBQU8sS0FBS0wsTUFBTCxDQUFZWixNQUFNLENBQUN2RSxTQUFuQixDQUFQO0FBQ0Q7QUF0QjJDLE9BQTlDO0FBd0JELEtBNUJELEVBSGlELENBaUNqRDs7QUFDQWdCLElBQUFBLGVBQWUsQ0FBQ3FFLE9BQWhCLENBQXdCckYsU0FBUyxJQUFJO0FBQ25DOUUsTUFBQUEsTUFBTSxDQUFDb0ssY0FBUCxDQUFzQixJQUF0QixFQUE0QnRGLFNBQTVCLEVBQXVDO0FBQ3JDdUYsUUFBQUEsR0FBRyxFQUFFLE1BQU07QUFDVCxjQUFJLENBQUMsS0FBS0osTUFBTCxDQUFZbkYsU0FBWixDQUFMLEVBQTZCO0FBQzNCLGtCQUFNdUUsTUFBTSxHQUFHQyxtQkFBbUIsQ0FBQztBQUNqQ3hFLGNBQUFBLFNBRGlDO0FBRWpDc0MsY0FBQUEsTUFBTSxFQUFFLEVBRnlCO0FBR2pDbUQsY0FBQUEscUJBQXFCLEVBQUU7QUFIVSxhQUFELENBQWxDO0FBS0Esa0JBQU1ELElBQUksR0FBRyxFQUFiO0FBQ0FBLFlBQUFBLElBQUksQ0FBQ2xELE1BQUwsR0FBY2lDLE1BQU0sQ0FBQ2pDLE1BQXJCO0FBQ0FrRCxZQUFBQSxJQUFJLENBQUNDLHFCQUFMLEdBQTZCbEIsTUFBTSxDQUFDa0IscUJBQXBDO0FBQ0FELFlBQUFBLElBQUksQ0FBQ1gsT0FBTCxHQUFlTixNQUFNLENBQUNNLE9BQXRCO0FBQ0EsaUJBQUtNLE1BQUwsQ0FBWW5GLFNBQVosSUFBeUJ3RixJQUF6QjtBQUNEOztBQUNELGlCQUFPLEtBQUtMLE1BQUwsQ0FBWW5GLFNBQVosQ0FBUDtBQUNEO0FBZm9DLE9BQXZDO0FBaUJELEtBbEJEO0FBbUJEOztBQXhEYzs7QUEyRGpCLE1BQU13RSxtQkFBbUIsR0FBRyxDQUFDO0FBQUV4RSxFQUFBQSxTQUFGO0FBQWFzQyxFQUFBQSxNQUFiO0FBQXFCbUQsRUFBQUEscUJBQXJCO0FBQTRDWixFQUFBQTtBQUE1QyxDQUFELEtBQW1FO0FBQzdGLFFBQU1pQixhQUFxQixHQUFHO0FBQzVCOUYsSUFBQUEsU0FENEI7QUFFNUJzQyxJQUFBQSxNQUFNLGdEQUNEckgsY0FBYyxDQUFDRyxRQURkLEdBRUFILGNBQWMsQ0FBQytFLFNBQUQsQ0FBZCxJQUE2QixFQUY3QixHQUdEc0MsTUFIQyxDQUZzQjtBQU81Qm1ELElBQUFBO0FBUDRCLEdBQTlCOztBQVNBLE1BQUlaLE9BQU8sSUFBSTNKLE1BQU0sQ0FBQzRKLElBQVAsQ0FBWUQsT0FBWixFQUFxQkUsTUFBckIsS0FBZ0MsQ0FBL0MsRUFBa0Q7QUFDaERlLElBQUFBLGFBQWEsQ0FBQ2pCLE9BQWQsR0FBd0JBLE9BQXhCO0FBQ0Q7O0FBQ0QsU0FBT2lCLGFBQVA7QUFDRCxDQWREOztBQWdCQSxNQUFNQyxZQUFZLEdBQUc7QUFBRS9GLEVBQUFBLFNBQVMsRUFBRSxRQUFiO0FBQXVCc0MsRUFBQUEsTUFBTSxFQUFFckgsY0FBYyxDQUFDNkU7QUFBOUMsQ0FBckI7QUFDQSxNQUFNa0csbUJBQW1CLEdBQUc7QUFDMUJoRyxFQUFBQSxTQUFTLEVBQUUsZUFEZTtBQUUxQnNDLEVBQUFBLE1BQU0sRUFBRXJILGNBQWMsQ0FBQ2tGO0FBRkcsQ0FBNUI7QUFJQSxNQUFNOEYsb0JBQW9CLEdBQUc7QUFDM0JqRyxFQUFBQSxTQUFTLEVBQUUsZ0JBRGdCO0FBRTNCc0MsRUFBQUEsTUFBTSxFQUFFckgsY0FBYyxDQUFDb0Y7QUFGSSxDQUE3Qjs7QUFJQSxNQUFNNkYsaUJBQWlCLEdBQUc1Qiw0QkFBNEIsQ0FDcERFLG1CQUFtQixDQUFDO0FBQ2xCeEUsRUFBQUEsU0FBUyxFQUFFLGFBRE87QUFFbEJzQyxFQUFBQSxNQUFNLEVBQUUsRUFGVTtBQUdsQm1ELEVBQUFBLHFCQUFxQixFQUFFO0FBSEwsQ0FBRCxDQURpQyxDQUF0RDs7QUFPQSxNQUFNVSxnQkFBZ0IsR0FBRzdCLDRCQUE0QixDQUNuREUsbUJBQW1CLENBQUM7QUFDbEJ4RSxFQUFBQSxTQUFTLEVBQUUsWUFETztBQUVsQnNDLEVBQUFBLE1BQU0sRUFBRSxFQUZVO0FBR2xCbUQsRUFBQUEscUJBQXFCLEVBQUU7QUFITCxDQUFELENBRGdDLENBQXJEOztBQU9BLE1BQU1XLGtCQUFrQixHQUFHOUIsNEJBQTRCLENBQ3JERSxtQkFBbUIsQ0FBQztBQUNsQnhFLEVBQUFBLFNBQVMsRUFBRSxjQURPO0FBRWxCc0MsRUFBQUEsTUFBTSxFQUFFLEVBRlU7QUFHbEJtRCxFQUFBQSxxQkFBcUIsRUFBRTtBQUhMLENBQUQsQ0FEa0MsQ0FBdkQ7O0FBT0EsTUFBTVksZUFBZSxHQUFHL0IsNEJBQTRCLENBQ2xERSxtQkFBbUIsQ0FBQztBQUNsQnhFLEVBQUFBLFNBQVMsRUFBRSxXQURPO0FBRWxCc0MsRUFBQUEsTUFBTSxFQUFFckgsY0FBYyxDQUFDc0YsU0FGTDtBQUdsQmtGLEVBQUFBLHFCQUFxQixFQUFFO0FBSEwsQ0FBRCxDQUQrQixDQUFwRDs7QUFPQSxNQUFNYSxrQkFBa0IsR0FBR2hDLDRCQUE0QixDQUNyREUsbUJBQW1CLENBQUM7QUFDbEJ4RSxFQUFBQSxTQUFTLEVBQUUsY0FETztBQUVsQnNDLEVBQUFBLE1BQU0sRUFBRXJILGNBQWMsQ0FBQ3lGLFlBRkw7QUFHbEIrRSxFQUFBQSxxQkFBcUIsRUFBRTtBQUhMLENBQUQsQ0FEa0MsQ0FBdkQ7O0FBT0EsTUFBTWMsc0JBQXNCLEdBQUcsQ0FDN0JSLFlBRDZCLEVBRTdCSSxnQkFGNkIsRUFHN0JDLGtCQUg2QixFQUk3QkYsaUJBSjZCLEVBSzdCRixtQkFMNkIsRUFNN0JDLG9CQU42QixFQU83QkksZUFQNkIsRUFRN0JDLGtCQVI2QixDQUEvQjs7O0FBV0EsTUFBTUUsdUJBQXVCLEdBQUcsQ0FBQ0MsTUFBRCxFQUErQkMsVUFBL0IsS0FBMkQ7QUFDekYsTUFBSUQsTUFBTSxDQUFDbkwsSUFBUCxLQUFnQm9MLFVBQVUsQ0FBQ3BMLElBQS9CLEVBQXFDLE9BQU8sS0FBUDtBQUNyQyxNQUFJbUwsTUFBTSxDQUFDeEosV0FBUCxLQUF1QnlKLFVBQVUsQ0FBQ3pKLFdBQXRDLEVBQW1ELE9BQU8sS0FBUDtBQUNuRCxNQUFJd0osTUFBTSxLQUFLQyxVQUFVLENBQUNwTCxJQUExQixFQUFnQyxPQUFPLElBQVA7QUFDaEMsTUFBSW1MLE1BQU0sQ0FBQ25MLElBQVAsS0FBZ0JvTCxVQUFVLENBQUNwTCxJQUEvQixFQUFxQyxPQUFPLElBQVA7QUFDckMsU0FBTyxLQUFQO0FBQ0QsQ0FORDs7QUFRQSxNQUFNcUwsWUFBWSxHQUFJckwsSUFBRCxJQUF3QztBQUMzRCxNQUFJLE9BQU9BLElBQVAsS0FBZ0IsUUFBcEIsRUFBOEI7QUFDNUIsV0FBT0EsSUFBUDtBQUNEOztBQUNELE1BQUlBLElBQUksQ0FBQzJCLFdBQVQsRUFBc0I7QUFDcEIsV0FBUSxHQUFFM0IsSUFBSSxDQUFDQSxJQUFLLElBQUdBLElBQUksQ0FBQzJCLFdBQVksR0FBeEM7QUFDRDs7QUFDRCxTQUFRLEdBQUUzQixJQUFJLENBQUNBLElBQUssRUFBcEI7QUFDRCxDQVJELEMsQ0FVQTtBQUNBOzs7QUFDZSxNQUFNc0wsZ0JBQU4sQ0FBdUI7QUFPcEMzQixFQUFBQSxXQUFXLENBQUM0QixlQUFELEVBQWtDO0FBQzNDLFNBQUtDLFVBQUwsR0FBa0JELGVBQWxCO0FBQ0EsU0FBS0UsVUFBTCxHQUFrQixJQUFJL0IsVUFBSixDQUFlZ0MscUJBQVlDLEdBQVosRUFBZixFQUFrQyxLQUFLbkUsZUFBdkMsQ0FBbEI7QUFDQSxTQUFLQSxlQUFMLEdBQXVCb0UsZ0JBQU8zQixHQUFQLENBQVd4SyxLQUFLLENBQUNvTSxhQUFqQixFQUFnQ3JFLGVBQXZEOztBQUVBLFVBQU1zRSxTQUFTLEdBQUdGLGdCQUFPM0IsR0FBUCxDQUFXeEssS0FBSyxDQUFDb00sYUFBakIsRUFBZ0NFLG1CQUFsRDs7QUFFQSxVQUFNQyxhQUFhLEdBQUcsVUFBdEIsQ0FQMkMsQ0FPVDs7QUFDbEMsVUFBTUMsV0FBVyxHQUFHLG1CQUFwQjtBQUVBLFNBQUtDLFdBQUwsR0FBbUJKLFNBQVMsR0FBR0UsYUFBSCxHQUFtQkMsV0FBL0M7O0FBRUEsU0FBS1QsVUFBTCxDQUFnQlcsS0FBaEIsQ0FBc0IsTUFBTTtBQUMxQixXQUFLQyxVQUFMLENBQWdCO0FBQUVDLFFBQUFBLFVBQVUsRUFBRTtBQUFkLE9BQWhCO0FBQ0QsS0FGRDtBQUdEOztBQUVERCxFQUFBQSxVQUFVLENBQUNFLE9BQTBCLEdBQUc7QUFBRUQsSUFBQUEsVUFBVSxFQUFFO0FBQWQsR0FBOUIsRUFBbUU7QUFDM0UsUUFBSSxLQUFLRSxpQkFBTCxJQUEwQixDQUFDRCxPQUFPLENBQUNELFVBQXZDLEVBQW1EO0FBQ2pELGFBQU8sS0FBS0UsaUJBQVo7QUFDRDs7QUFDRCxTQUFLQSxpQkFBTCxHQUF5QixLQUFLQyxhQUFMLENBQW1CRixPQUFuQixFQUN0QkcsSUFEc0IsQ0FFckI3QyxVQUFVLElBQUk7QUFDWixXQUFLNkIsVUFBTCxHQUFrQixJQUFJL0IsVUFBSixDQUFlRSxVQUFmLEVBQTJCLEtBQUtwQyxlQUFoQyxDQUFsQjtBQUNBLGFBQU8sS0FBSytFLGlCQUFaO0FBQ0QsS0FMb0IsRUFNckJHLEdBQUcsSUFBSTtBQUNMLFdBQUtqQixVQUFMLEdBQWtCLElBQUkvQixVQUFKLEVBQWxCO0FBQ0EsYUFBTyxLQUFLNkMsaUJBQVo7QUFDQSxZQUFNRyxHQUFOO0FBQ0QsS0FWb0IsRUFZdEJELElBWnNCLENBWWpCLE1BQU0sQ0FBRSxDQVpTLENBQXpCO0FBYUEsV0FBTyxLQUFLRixpQkFBWjtBQUNEOztBQUVEQyxFQUFBQSxhQUFhLENBQUNGLE9BQTBCLEdBQUc7QUFBRUQsSUFBQUEsVUFBVSxFQUFFO0FBQWQsR0FBOUIsRUFBNkU7QUFDeEYsUUFBSUMsT0FBTyxDQUFDRCxVQUFaLEVBQXdCO0FBQ3RCLGFBQU8sS0FBS00sYUFBTCxFQUFQO0FBQ0Q7O0FBQ0QsVUFBTUMsTUFBTSxHQUFHbEIscUJBQVlDLEdBQVosRUFBZjs7QUFDQSxRQUFJaUIsTUFBTSxJQUFJQSxNQUFNLENBQUNuRCxNQUFyQixFQUE2QjtBQUMzQixhQUFPb0QsT0FBTyxDQUFDQyxPQUFSLENBQWdCRixNQUFoQixDQUFQO0FBQ0Q7O0FBQ0QsV0FBTyxLQUFLRCxhQUFMLEVBQVA7QUFDRDs7QUFFREEsRUFBQUEsYUFBYSxHQUEyQjtBQUN0QyxXQUFPLEtBQUtuQixVQUFMLENBQ0pnQixhQURJLEdBRUpDLElBRkksQ0FFQzdDLFVBQVUsSUFBSUEsVUFBVSxDQUFDbUQsR0FBWCxDQUFlN0QsbUJBQWYsQ0FGZixFQUdKdUQsSUFISSxDQUdDN0MsVUFBVSxJQUFJO0FBQ2xCOEIsMkJBQVlzQixHQUFaLENBQWdCcEQsVUFBaEI7O0FBQ0EsYUFBT0EsVUFBUDtBQUNELEtBTkksQ0FBUDtBQU9EOztBQUVEcUQsRUFBQUEsWUFBWSxDQUNWdkksU0FEVSxFQUVWd0ksb0JBQTZCLEdBQUcsS0FGdEIsRUFHVlosT0FBMEIsR0FBRztBQUFFRCxJQUFBQSxVQUFVLEVBQUU7QUFBZCxHQUhuQixFQUlPO0FBQ2pCLFFBQUlDLE9BQU8sQ0FBQ0QsVUFBWixFQUF3QjtBQUN0QlgsMkJBQVl5QixLQUFaO0FBQ0Q7O0FBQ0QsUUFBSUQsb0JBQW9CLElBQUl4SCxlQUFlLENBQUN3QixPQUFoQixDQUF3QnhDLFNBQXhCLElBQXFDLENBQUMsQ0FBbEUsRUFBcUU7QUFDbkUsWUFBTXdGLElBQUksR0FBRyxLQUFLdUIsVUFBTCxDQUFnQi9HLFNBQWhCLENBQWI7QUFDQSxhQUFPbUksT0FBTyxDQUFDQyxPQUFSLENBQWdCO0FBQ3JCcEksUUFBQUEsU0FEcUI7QUFFckJzQyxRQUFBQSxNQUFNLEVBQUVrRCxJQUFJLENBQUNsRCxNQUZRO0FBR3JCbUQsUUFBQUEscUJBQXFCLEVBQUVELElBQUksQ0FBQ0MscUJBSFA7QUFJckJaLFFBQUFBLE9BQU8sRUFBRVcsSUFBSSxDQUFDWDtBQUpPLE9BQWhCLENBQVA7QUFNRDs7QUFDRCxVQUFNcUQsTUFBTSxHQUFHbEIscUJBQVl6QixHQUFaLENBQWdCdkYsU0FBaEIsQ0FBZjs7QUFDQSxRQUFJa0ksTUFBTSxJQUFJLENBQUNOLE9BQU8sQ0FBQ0QsVUFBdkIsRUFBbUM7QUFDakMsYUFBT1EsT0FBTyxDQUFDQyxPQUFSLENBQWdCRixNQUFoQixDQUFQO0FBQ0Q7O0FBQ0QsV0FBTyxLQUFLRCxhQUFMLEdBQXFCRixJQUFyQixDQUEwQjdDLFVBQVUsSUFBSTtBQUM3QyxZQUFNd0QsU0FBUyxHQUFHeEQsVUFBVSxDQUFDeUQsSUFBWCxDQUFnQnBFLE1BQU0sSUFBSUEsTUFBTSxDQUFDdkUsU0FBUCxLQUFxQkEsU0FBL0MsQ0FBbEI7O0FBQ0EsVUFBSSxDQUFDMEksU0FBTCxFQUFnQjtBQUNkLGVBQU9QLE9BQU8sQ0FBQ1MsTUFBUixDQUFleEUsU0FBZixDQUFQO0FBQ0Q7O0FBQ0QsYUFBT3NFLFNBQVA7QUFDRCxLQU5NLENBQVA7QUFPRCxHQTdGbUMsQ0ErRnBDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFDQSxRQUFNRyxtQkFBTixDQUNFN0ksU0FERixFQUVFc0MsTUFBb0IsR0FBRyxFQUZ6QixFQUdFbUQscUJBSEYsRUFJRVosT0FBWSxHQUFHLEVBSmpCLEVBSzBCO0FBQ3hCLFFBQUlpRSxlQUFlLEdBQUcsS0FBS0MsZ0JBQUwsQ0FBc0IvSSxTQUF0QixFQUFpQ3NDLE1BQWpDLEVBQXlDbUQscUJBQXpDLENBQXRCOztBQUNBLFFBQUlxRCxlQUFKLEVBQXFCO0FBQ25CLFVBQUlBLGVBQWUsWUFBWS9OLEtBQUssQ0FBQ2lILEtBQXJDLEVBQTRDO0FBQzFDLGVBQU9tRyxPQUFPLENBQUNTLE1BQVIsQ0FBZUUsZUFBZixDQUFQO0FBQ0QsT0FGRCxNQUVPLElBQUlBLGVBQWUsQ0FBQ0UsSUFBaEIsSUFBd0JGLGVBQWUsQ0FBQ0csS0FBNUMsRUFBbUQ7QUFDeEQsZUFBT2QsT0FBTyxDQUFDUyxNQUFSLENBQWUsSUFBSTdOLEtBQUssQ0FBQ2lILEtBQVYsQ0FBZ0I4RyxlQUFlLENBQUNFLElBQWhDLEVBQXNDRixlQUFlLENBQUNHLEtBQXRELENBQWYsQ0FBUDtBQUNEOztBQUNELGFBQU9kLE9BQU8sQ0FBQ1MsTUFBUixDQUFlRSxlQUFmLENBQVA7QUFDRDs7QUFDRCxRQUFJO0FBQ0YsWUFBTUksYUFBYSxHQUFHLE1BQU0sS0FBS3BDLFVBQUwsQ0FBZ0JxQyxXQUFoQixDQUMxQm5KLFNBRDBCLEVBRTFCc0UsNEJBQTRCLENBQUM7QUFDM0JoQyxRQUFBQSxNQUQyQjtBQUUzQm1ELFFBQUFBLHFCQUYyQjtBQUczQlosUUFBQUEsT0FIMkI7QUFJM0I3RSxRQUFBQTtBQUoyQixPQUFELENBRkYsQ0FBNUIsQ0FERSxDQVVGOztBQUNBLFlBQU0sS0FBSzBILFVBQUwsQ0FBZ0I7QUFBRUMsUUFBQUEsVUFBVSxFQUFFO0FBQWQsT0FBaEIsQ0FBTjtBQUNBLFlBQU15QixXQUFXLEdBQUd4RSxpQ0FBaUMsQ0FBQ3NFLGFBQUQsQ0FBckQ7QUFDQSxhQUFPRSxXQUFQO0FBQ0QsS0FkRCxDQWNFLE9BQU9ILEtBQVAsRUFBYztBQUNkLFVBQUlBLEtBQUssSUFBSUEsS0FBSyxDQUFDRCxJQUFOLEtBQWVqTyxLQUFLLENBQUNpSCxLQUFOLENBQVlxSCxlQUF4QyxFQUF5RDtBQUN2RCxjQUFNLElBQUl0TyxLQUFLLENBQUNpSCxLQUFWLENBQWdCakgsS0FBSyxDQUFDaUgsS0FBTixDQUFZbUMsa0JBQTVCLEVBQWlELFNBQVFuRSxTQUFVLGtCQUFuRSxDQUFOO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsY0FBTWlKLEtBQU47QUFDRDtBQUNGO0FBQ0Y7O0FBRURLLEVBQUFBLFdBQVcsQ0FDVHRKLFNBRFMsRUFFVHVKLGVBRlMsRUFHVDlELHFCQUhTLEVBSVRaLE9BSlMsRUFLVDJFLFFBTFMsRUFNVDtBQUNBLFdBQU8sS0FBS2pCLFlBQUwsQ0FBa0J2SSxTQUFsQixFQUNKK0gsSUFESSxDQUNDeEQsTUFBTSxJQUFJO0FBQ2QsWUFBTWtGLGNBQWMsR0FBR2xGLE1BQU0sQ0FBQ2pDLE1BQTlCO0FBQ0FwSCxNQUFBQSxNQUFNLENBQUM0SixJQUFQLENBQVl5RSxlQUFaLEVBQTZCbEUsT0FBN0IsQ0FBcUN0SSxJQUFJLElBQUk7QUFDM0MsY0FBTWtHLEtBQUssR0FBR3NHLGVBQWUsQ0FBQ3hNLElBQUQsQ0FBN0I7O0FBQ0EsWUFBSTBNLGNBQWMsQ0FBQzFNLElBQUQsQ0FBZCxJQUF3QmtHLEtBQUssQ0FBQ3lHLElBQU4sS0FBZSxRQUEzQyxFQUFxRDtBQUNuRCxnQkFBTSxJQUFJM08sS0FBSyxDQUFDaUgsS0FBVixDQUFnQixHQUFoQixFQUFzQixTQUFRakYsSUFBSyx5QkFBbkMsQ0FBTjtBQUNEOztBQUNELFlBQUksQ0FBQzBNLGNBQWMsQ0FBQzFNLElBQUQsQ0FBZixJQUF5QmtHLEtBQUssQ0FBQ3lHLElBQU4sS0FBZSxRQUE1QyxFQUFzRDtBQUNwRCxnQkFBTSxJQUFJM08sS0FBSyxDQUFDaUgsS0FBVixDQUFnQixHQUFoQixFQUFzQixTQUFRakYsSUFBSyxpQ0FBbkMsQ0FBTjtBQUNEO0FBQ0YsT0FSRDtBQVVBLGFBQU8wTSxjQUFjLENBQUNoRixNQUF0QjtBQUNBLGFBQU9nRixjQUFjLENBQUMvRSxNQUF0QjtBQUNBLFlBQU1pRixTQUFTLEdBQUdDLHVCQUF1QixDQUFDSCxjQUFELEVBQWlCRixlQUFqQixDQUF6QztBQUNBLFlBQU1NLGFBQWEsR0FBRzVPLGNBQWMsQ0FBQytFLFNBQUQsQ0FBZCxJQUE2Qi9FLGNBQWMsQ0FBQ0csUUFBbEU7QUFDQSxZQUFNME8sYUFBYSxHQUFHNU8sTUFBTSxDQUFDNk8sTUFBUCxDQUFjLEVBQWQsRUFBa0JKLFNBQWxCLEVBQTZCRSxhQUE3QixDQUF0QjtBQUNBLFlBQU1mLGVBQWUsR0FBRyxLQUFLa0Isa0JBQUwsQ0FDdEJoSyxTQURzQixFQUV0QjJKLFNBRnNCLEVBR3RCbEUscUJBSHNCLEVBSXRCdkssTUFBTSxDQUFDNEosSUFBUCxDQUFZMkUsY0FBWixDQUpzQixDQUF4Qjs7QUFNQSxVQUFJWCxlQUFKLEVBQXFCO0FBQ25CLGNBQU0sSUFBSS9OLEtBQUssQ0FBQ2lILEtBQVYsQ0FBZ0I4RyxlQUFlLENBQUNFLElBQWhDLEVBQXNDRixlQUFlLENBQUNHLEtBQXRELENBQU47QUFDRCxPQXpCYSxDQTJCZDtBQUNBOzs7QUFDQSxZQUFNZ0IsYUFBdUIsR0FBRyxFQUFoQztBQUNBLFlBQU1DLGNBQWMsR0FBRyxFQUF2QjtBQUNBaFAsTUFBQUEsTUFBTSxDQUFDNEosSUFBUCxDQUFZeUUsZUFBWixFQUE2QmxFLE9BQTdCLENBQXFDMUMsU0FBUyxJQUFJO0FBQ2hELFlBQUk0RyxlQUFlLENBQUM1RyxTQUFELENBQWYsQ0FBMkIrRyxJQUEzQixLQUFvQyxRQUF4QyxFQUFrRDtBQUNoRE8sVUFBQUEsYUFBYSxDQUFDRSxJQUFkLENBQW1CeEgsU0FBbkI7QUFDRCxTQUZELE1BRU87QUFDTHVILFVBQUFBLGNBQWMsQ0FBQ0MsSUFBZixDQUFvQnhILFNBQXBCO0FBQ0Q7QUFDRixPQU5EO0FBUUEsVUFBSXlILGFBQWEsR0FBR2pDLE9BQU8sQ0FBQ0MsT0FBUixFQUFwQjs7QUFDQSxVQUFJNkIsYUFBYSxDQUFDbEYsTUFBZCxHQUF1QixDQUEzQixFQUE4QjtBQUM1QnFGLFFBQUFBLGFBQWEsR0FBRyxLQUFLQyxZQUFMLENBQWtCSixhQUFsQixFQUFpQ2pLLFNBQWpDLEVBQTRDd0osUUFBNUMsQ0FBaEI7QUFDRDs7QUFDRCxVQUFJYyxhQUFhLEdBQUcsRUFBcEI7QUFDQSxhQUNFRixhQUFhLENBQUM7QUFBRCxPQUNWckMsSUFESCxDQUNRLE1BQU0sS0FBS0wsVUFBTCxDQUFnQjtBQUFFQyxRQUFBQSxVQUFVLEVBQUU7QUFBZCxPQUFoQixDQURkLEVBQ3FEO0FBRHJELE9BRUdJLElBRkgsQ0FFUSxNQUFNO0FBQ1YsY0FBTXdDLFFBQVEsR0FBR0wsY0FBYyxDQUFDN0IsR0FBZixDQUFtQjFGLFNBQVMsSUFBSTtBQUMvQyxnQkFBTXJILElBQUksR0FBR2lPLGVBQWUsQ0FBQzVHLFNBQUQsQ0FBNUI7QUFDQSxpQkFBTyxLQUFLNkgsa0JBQUwsQ0FBd0J4SyxTQUF4QixFQUFtQzJDLFNBQW5DLEVBQThDckgsSUFBOUMsQ0FBUDtBQUNELFNBSGdCLENBQWpCO0FBSUEsZUFBTzZNLE9BQU8sQ0FBQ2xCLEdBQVIsQ0FBWXNELFFBQVosQ0FBUDtBQUNELE9BUkgsRUFTR3hDLElBVEgsQ0FTUTBDLE9BQU8sSUFBSTtBQUNmSCxRQUFBQSxhQUFhLEdBQUdHLE9BQU8sQ0FBQ0MsTUFBUixDQUFlQyxNQUFNLElBQUksQ0FBQyxDQUFDQSxNQUEzQixDQUFoQjtBQUNBLGVBQU8sS0FBS0MsY0FBTCxDQUFvQjVLLFNBQXBCLEVBQStCeUYscUJBQS9CLEVBQXNEa0UsU0FBdEQsQ0FBUDtBQUNELE9BWkgsRUFhRzVCLElBYkgsQ0FhUSxNQUNKLEtBQUtqQixVQUFMLENBQWdCK0QsMEJBQWhCLENBQ0U3SyxTQURGLEVBRUU2RSxPQUZGLEVBR0VOLE1BQU0sQ0FBQ00sT0FIVCxFQUlFaUYsYUFKRixDQWRKLEVBcUJHL0IsSUFyQkgsQ0FxQlEsTUFBTSxLQUFLTCxVQUFMLENBQWdCO0FBQUVDLFFBQUFBLFVBQVUsRUFBRTtBQUFkLE9BQWhCLENBckJkLEVBc0JFO0FBdEJGLE9BdUJHSSxJQXZCSCxDQXVCUSxNQUFNO0FBQ1YsYUFBSytDLFlBQUwsQ0FBa0JSLGFBQWxCO0FBQ0EsY0FBTS9GLE1BQU0sR0FBRyxLQUFLd0MsVUFBTCxDQUFnQi9HLFNBQWhCLENBQWY7QUFDQSxjQUFNK0ssY0FBc0IsR0FBRztBQUM3Qi9LLFVBQUFBLFNBQVMsRUFBRUEsU0FEa0I7QUFFN0JzQyxVQUFBQSxNQUFNLEVBQUVpQyxNQUFNLENBQUNqQyxNQUZjO0FBRzdCbUQsVUFBQUEscUJBQXFCLEVBQUVsQixNQUFNLENBQUNrQjtBQUhELFNBQS9COztBQUtBLFlBQUlsQixNQUFNLENBQUNNLE9BQVAsSUFBa0IzSixNQUFNLENBQUM0SixJQUFQLENBQVlQLE1BQU0sQ0FBQ00sT0FBbkIsRUFBNEJFLE1BQTVCLEtBQXVDLENBQTdELEVBQWdFO0FBQzlEZ0csVUFBQUEsY0FBYyxDQUFDbEcsT0FBZixHQUF5Qk4sTUFBTSxDQUFDTSxPQUFoQztBQUNEOztBQUNELGVBQU9rRyxjQUFQO0FBQ0QsT0FuQ0gsQ0FERjtBQXNDRCxLQW5GSSxFQW9GSkMsS0FwRkksQ0FvRkUvQixLQUFLLElBQUk7QUFDZCxVQUFJQSxLQUFLLEtBQUs3RSxTQUFkLEVBQXlCO0FBQ3ZCLGNBQU0sSUFBSXJKLEtBQUssQ0FBQ2lILEtBQVYsQ0FDSmpILEtBQUssQ0FBQ2lILEtBQU4sQ0FBWW1DLGtCQURSLEVBRUgsU0FBUW5FLFNBQVUsa0JBRmYsQ0FBTjtBQUlELE9BTEQsTUFLTztBQUNMLGNBQU1pSixLQUFOO0FBQ0Q7QUFDRixLQTdGSSxDQUFQO0FBOEZELEdBalBtQyxDQW1QcEM7QUFDQTs7O0FBQ0FnQyxFQUFBQSxrQkFBa0IsQ0FBQ2pMLFNBQUQsRUFBK0M7QUFDL0QsUUFBSSxLQUFLK0csVUFBTCxDQUFnQi9HLFNBQWhCLENBQUosRUFBZ0M7QUFDOUIsYUFBT21JLE9BQU8sQ0FBQ0MsT0FBUixDQUFnQixJQUFoQixDQUFQO0FBQ0QsS0FIOEQsQ0FJL0Q7OztBQUNBLFdBQ0U7QUFDQSxXQUFLUyxtQkFBTCxDQUF5QjdJLFNBQXpCLEVBQ0dnTCxLQURILENBQ1MsTUFBTTtBQUNYO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZUFBTyxLQUFLdEQsVUFBTCxDQUFnQjtBQUFFQyxVQUFBQSxVQUFVLEVBQUU7QUFBZCxTQUFoQixDQUFQO0FBQ0QsT0FQSCxFQVFHSSxJQVJILENBUVEsTUFBTTtBQUNWO0FBQ0EsWUFBSSxLQUFLaEIsVUFBTCxDQUFnQi9HLFNBQWhCLENBQUosRUFBZ0M7QUFDOUIsaUJBQU8sSUFBUDtBQUNELFNBRkQsTUFFTztBQUNMLGdCQUFNLElBQUlqRixLQUFLLENBQUNpSCxLQUFWLENBQWdCakgsS0FBSyxDQUFDaUgsS0FBTixDQUFZQyxZQUE1QixFQUEyQyxpQkFBZ0JqQyxTQUFVLEVBQXJFLENBQU47QUFDRDtBQUNGLE9BZkgsRUFnQkdnTCxLQWhCSCxDQWdCUyxNQUFNO0FBQ1g7QUFDQSxjQUFNLElBQUlqUSxLQUFLLENBQUNpSCxLQUFWLENBQWdCakgsS0FBSyxDQUFDaUgsS0FBTixDQUFZQyxZQUE1QixFQUEwQyx1Q0FBMUMsQ0FBTjtBQUNELE9BbkJIO0FBRkY7QUF1QkQ7O0FBRUQ4RyxFQUFBQSxnQkFBZ0IsQ0FBQy9JLFNBQUQsRUFBb0JzQyxNQUFvQixHQUFHLEVBQTNDLEVBQStDbUQscUJBQS9DLEVBQWdGO0FBQzlGLFFBQUksS0FBS3NCLFVBQUwsQ0FBZ0IvRyxTQUFoQixDQUFKLEVBQWdDO0FBQzlCLFlBQU0sSUFBSWpGLEtBQUssQ0FBQ2lILEtBQVYsQ0FBZ0JqSCxLQUFLLENBQUNpSCxLQUFOLENBQVltQyxrQkFBNUIsRUFBaUQsU0FBUW5FLFNBQVUsa0JBQW5FLENBQU47QUFDRDs7QUFDRCxRQUFJLENBQUMwRCxnQkFBZ0IsQ0FBQzFELFNBQUQsQ0FBckIsRUFBa0M7QUFDaEMsYUFBTztBQUNMZ0osUUFBQUEsSUFBSSxFQUFFak8sS0FBSyxDQUFDaUgsS0FBTixDQUFZbUMsa0JBRGI7QUFFTDhFLFFBQUFBLEtBQUssRUFBRWxGLHVCQUF1QixDQUFDL0QsU0FBRDtBQUZ6QixPQUFQO0FBSUQ7O0FBQ0QsV0FBTyxLQUFLZ0ssa0JBQUwsQ0FBd0JoSyxTQUF4QixFQUFtQ3NDLE1BQW5DLEVBQTJDbUQscUJBQTNDLEVBQWtFLEVBQWxFLENBQVA7QUFDRDs7QUFFRHVFLEVBQUFBLGtCQUFrQixDQUNoQmhLLFNBRGdCLEVBRWhCc0MsTUFGZ0IsRUFHaEJtRCxxQkFIZ0IsRUFJaEJ5RixrQkFKZ0IsRUFLaEI7QUFDQSxTQUFLLE1BQU12SSxTQUFYLElBQXdCTCxNQUF4QixFQUFnQztBQUM5QixVQUFJNEksa0JBQWtCLENBQUMxSSxPQUFuQixDQUEyQkcsU0FBM0IsSUFBd0MsQ0FBNUMsRUFBK0M7QUFDN0MsWUFBSSxDQUFDaUIsZ0JBQWdCLENBQUNqQixTQUFELEVBQVkzQyxTQUFaLENBQXJCLEVBQTZDO0FBQzNDLGlCQUFPO0FBQ0xnSixZQUFBQSxJQUFJLEVBQUVqTyxLQUFLLENBQUNpSCxLQUFOLENBQVltSixnQkFEYjtBQUVMbEMsWUFBQUEsS0FBSyxFQUFFLHlCQUF5QnRHO0FBRjNCLFdBQVA7QUFJRDs7QUFDRCxZQUFJLENBQUNtQix3QkFBd0IsQ0FBQ25CLFNBQUQsRUFBWTNDLFNBQVosQ0FBN0IsRUFBcUQ7QUFDbkQsaUJBQU87QUFDTGdKLFlBQUFBLElBQUksRUFBRSxHQUREO0FBRUxDLFlBQUFBLEtBQUssRUFBRSxXQUFXdEcsU0FBWCxHQUF1QjtBQUZ6QixXQUFQO0FBSUQ7O0FBQ0QsY0FBTXlJLFNBQVMsR0FBRzlJLE1BQU0sQ0FBQ0ssU0FBRCxDQUF4QjtBQUNBLGNBQU1zRyxLQUFLLEdBQUcvRSxrQkFBa0IsQ0FBQ2tILFNBQUQsQ0FBaEM7QUFDQSxZQUFJbkMsS0FBSixFQUFXLE9BQU87QUFBRUQsVUFBQUEsSUFBSSxFQUFFQyxLQUFLLENBQUNELElBQWQ7QUFBb0JDLFVBQUFBLEtBQUssRUFBRUEsS0FBSyxDQUFDN0o7QUFBakMsU0FBUDs7QUFDWCxZQUFJZ00sU0FBUyxDQUFDQyxZQUFWLEtBQTJCakgsU0FBL0IsRUFBMEM7QUFDeEMsY0FBSWtILGdCQUFnQixHQUFHQyxPQUFPLENBQUNILFNBQVMsQ0FBQ0MsWUFBWCxDQUE5Qjs7QUFDQSxjQUFJLE9BQU9DLGdCQUFQLEtBQTRCLFFBQWhDLEVBQTBDO0FBQ3hDQSxZQUFBQSxnQkFBZ0IsR0FBRztBQUFFaFEsY0FBQUEsSUFBSSxFQUFFZ1E7QUFBUixhQUFuQjtBQUNELFdBRkQsTUFFTyxJQUFJLE9BQU9BLGdCQUFQLEtBQTRCLFFBQTVCLElBQXdDRixTQUFTLENBQUM5UCxJQUFWLEtBQW1CLFVBQS9ELEVBQTJFO0FBQ2hGLG1CQUFPO0FBQ0wwTixjQUFBQSxJQUFJLEVBQUVqTyxLQUFLLENBQUNpSCxLQUFOLENBQVlxQyxjQURiO0FBRUw0RSxjQUFBQSxLQUFLLEVBQUcsb0RBQW1EdEMsWUFBWSxDQUFDeUUsU0FBRCxDQUFZO0FBRjlFLGFBQVA7QUFJRDs7QUFDRCxjQUFJLENBQUM1RSx1QkFBdUIsQ0FBQzRFLFNBQUQsRUFBWUUsZ0JBQVosQ0FBNUIsRUFBMkQ7QUFDekQsbUJBQU87QUFDTHRDLGNBQUFBLElBQUksRUFBRWpPLEtBQUssQ0FBQ2lILEtBQU4sQ0FBWXFDLGNBRGI7QUFFTDRFLGNBQUFBLEtBQUssRUFBRyx1QkFBc0JqSixTQUFVLElBQUcyQyxTQUFVLDRCQUEyQmdFLFlBQVksQ0FDMUZ5RSxTQUQwRixDQUUxRixZQUFXekUsWUFBWSxDQUFDMkUsZ0JBQUQsQ0FBbUI7QUFKdkMsYUFBUDtBQU1EO0FBQ0YsU0FsQkQsTUFrQk8sSUFBSUYsU0FBUyxDQUFDSSxRQUFkLEVBQXdCO0FBQzdCLGNBQUksT0FBT0osU0FBUCxLQUFxQixRQUFyQixJQUFpQ0EsU0FBUyxDQUFDOVAsSUFBVixLQUFtQixVQUF4RCxFQUFvRTtBQUNsRSxtQkFBTztBQUNMME4sY0FBQUEsSUFBSSxFQUFFak8sS0FBSyxDQUFDaUgsS0FBTixDQUFZcUMsY0FEYjtBQUVMNEUsY0FBQUEsS0FBSyxFQUFHLCtDQUE4Q3RDLFlBQVksQ0FBQ3lFLFNBQUQsQ0FBWTtBQUZ6RSxhQUFQO0FBSUQ7QUFDRjtBQUNGO0FBQ0Y7O0FBRUQsU0FBSyxNQUFNekksU0FBWCxJQUF3QjFILGNBQWMsQ0FBQytFLFNBQUQsQ0FBdEMsRUFBbUQ7QUFDakRzQyxNQUFBQSxNQUFNLENBQUNLLFNBQUQsQ0FBTixHQUFvQjFILGNBQWMsQ0FBQytFLFNBQUQsQ0FBZCxDQUEwQjJDLFNBQTFCLENBQXBCO0FBQ0Q7O0FBRUQsVUFBTThJLFNBQVMsR0FBR3ZRLE1BQU0sQ0FBQzRKLElBQVAsQ0FBWXhDLE1BQVosRUFBb0JvSSxNQUFwQixDQUNoQmhKLEdBQUcsSUFBSVksTUFBTSxDQUFDWixHQUFELENBQU4sSUFBZVksTUFBTSxDQUFDWixHQUFELENBQU4sQ0FBWXBHLElBQVosS0FBcUIsVUFEM0IsQ0FBbEI7O0FBR0EsUUFBSW1RLFNBQVMsQ0FBQzFHLE1BQVYsR0FBbUIsQ0FBdkIsRUFBMEI7QUFDeEIsYUFBTztBQUNMaUUsUUFBQUEsSUFBSSxFQUFFak8sS0FBSyxDQUFDaUgsS0FBTixDQUFZcUMsY0FEYjtBQUVMNEUsUUFBQUEsS0FBSyxFQUNILHVFQUNBd0MsU0FBUyxDQUFDLENBQUQsQ0FEVCxHQUVBLFFBRkEsR0FHQUEsU0FBUyxDQUFDLENBQUQsQ0FIVCxHQUlBO0FBUEcsT0FBUDtBQVNEOztBQUNEckosSUFBQUEsV0FBVyxDQUFDcUQscUJBQUQsRUFBd0JuRCxNQUF4QixFQUFnQyxLQUFLa0YsV0FBckMsQ0FBWDtBQUNELEdBdldtQyxDQXlXcEM7OztBQUNBLFFBQU1vRCxjQUFOLENBQXFCNUssU0FBckIsRUFBd0NxQyxLQUF4QyxFQUFvRHNILFNBQXBELEVBQTZFO0FBQzNFLFFBQUksT0FBT3RILEtBQVAsS0FBaUIsV0FBckIsRUFBa0M7QUFDaEMsYUFBTzhGLE9BQU8sQ0FBQ0MsT0FBUixFQUFQO0FBQ0Q7O0FBQ0RoRyxJQUFBQSxXQUFXLENBQUNDLEtBQUQsRUFBUXNILFNBQVIsRUFBbUIsS0FBS25DLFdBQXhCLENBQVg7QUFDQSxVQUFNLEtBQUtWLFVBQUwsQ0FBZ0I0RSx3QkFBaEIsQ0FBeUMxTCxTQUF6QyxFQUFvRHFDLEtBQXBELENBQU47O0FBQ0EsVUFBTTZGLE1BQU0sR0FBR2xCLHFCQUFZekIsR0FBWixDQUFnQnZGLFNBQWhCLENBQWY7O0FBQ0EsUUFBSWtJLE1BQUosRUFBWTtBQUNWQSxNQUFBQSxNQUFNLENBQUN6QyxxQkFBUCxHQUErQnBELEtBQS9CO0FBQ0Q7QUFDRixHQXBYbUMsQ0FzWHBDO0FBQ0E7QUFDQTtBQUNBOzs7QUFDQW1JLEVBQUFBLGtCQUFrQixDQUFDeEssU0FBRCxFQUFvQjJDLFNBQXBCLEVBQXVDckgsSUFBdkMsRUFBbUU7QUFDbkYsUUFBSXFILFNBQVMsQ0FBQ0gsT0FBVixDQUFrQixHQUFsQixJQUF5QixDQUE3QixFQUFnQztBQUM5QjtBQUNBRyxNQUFBQSxTQUFTLEdBQUdBLFNBQVMsQ0FBQ2dKLEtBQVYsQ0FBZ0IsR0FBaEIsRUFBcUIsQ0FBckIsQ0FBWjtBQUNBclEsTUFBQUEsSUFBSSxHQUFHLFFBQVA7QUFDRDs7QUFDRCxRQUFJLENBQUNzSSxnQkFBZ0IsQ0FBQ2pCLFNBQUQsRUFBWTNDLFNBQVosQ0FBckIsRUFBNkM7QUFDM0MsWUFBTSxJQUFJakYsS0FBSyxDQUFDaUgsS0FBVixDQUFnQmpILEtBQUssQ0FBQ2lILEtBQU4sQ0FBWW1KLGdCQUE1QixFQUErQyx1QkFBc0J4SSxTQUFVLEdBQS9FLENBQU47QUFDRCxLQVJrRixDQVVuRjs7O0FBQ0EsUUFBSSxDQUFDckgsSUFBTCxFQUFXO0FBQ1QsYUFBTzhJLFNBQVA7QUFDRDs7QUFFRCxVQUFNd0gsWUFBWSxHQUFHLEtBQUtDLGVBQUwsQ0FBcUI3TCxTQUFyQixFQUFnQzJDLFNBQWhDLENBQXJCOztBQUNBLFFBQUksT0FBT3JILElBQVAsS0FBZ0IsUUFBcEIsRUFBOEI7QUFDNUJBLE1BQUFBLElBQUksR0FBSTtBQUFFQSxRQUFBQTtBQUFGLE9BQVI7QUFDRDs7QUFFRCxRQUFJQSxJQUFJLENBQUMrUCxZQUFMLEtBQXNCakgsU0FBMUIsRUFBcUM7QUFDbkMsVUFBSWtILGdCQUFnQixHQUFHQyxPQUFPLENBQUNqUSxJQUFJLENBQUMrUCxZQUFOLENBQTlCOztBQUNBLFVBQUksT0FBT0MsZ0JBQVAsS0FBNEIsUUFBaEMsRUFBMEM7QUFDeENBLFFBQUFBLGdCQUFnQixHQUFHO0FBQUVoUSxVQUFBQSxJQUFJLEVBQUVnUTtBQUFSLFNBQW5CO0FBQ0Q7O0FBQ0QsVUFBSSxDQUFDOUUsdUJBQXVCLENBQUNsTCxJQUFELEVBQU9nUSxnQkFBUCxDQUE1QixFQUFzRDtBQUNwRCxjQUFNLElBQUl2USxLQUFLLENBQUNpSCxLQUFWLENBQ0pqSCxLQUFLLENBQUNpSCxLQUFOLENBQVlxQyxjQURSLEVBRUgsdUJBQXNCckUsU0FBVSxJQUFHMkMsU0FBVSw0QkFBMkJnRSxZQUFZLENBQ25GckwsSUFEbUYsQ0FFbkYsWUFBV3FMLFlBQVksQ0FBQzJFLGdCQUFELENBQW1CLEVBSnhDLENBQU47QUFNRDtBQUNGOztBQUVELFFBQUlNLFlBQUosRUFBa0I7QUFDaEIsVUFBSSxDQUFDcEYsdUJBQXVCLENBQUNvRixZQUFELEVBQWV0USxJQUFmLENBQTVCLEVBQWtEO0FBQ2hELGNBQU0sSUFBSVAsS0FBSyxDQUFDaUgsS0FBVixDQUNKakgsS0FBSyxDQUFDaUgsS0FBTixDQUFZcUMsY0FEUixFQUVILHVCQUFzQnJFLFNBQVUsSUFBRzJDLFNBQVUsY0FBYWdFLFlBQVksQ0FDckVpRixZQURxRSxDQUVyRSxZQUFXakYsWUFBWSxDQUFDckwsSUFBRCxDQUFPLEVBSjVCLENBQU47QUFNRDs7QUFDRCxhQUFPOEksU0FBUDtBQUNEOztBQUVELFdBQU8sS0FBSzBDLFVBQUwsQ0FDSmdGLG1CQURJLENBQ2dCOUwsU0FEaEIsRUFDMkIyQyxTQUQzQixFQUNzQ3JILElBRHRDLEVBRUowUCxLQUZJLENBRUUvQixLQUFLLElBQUk7QUFDZCxVQUFJQSxLQUFLLENBQUNELElBQU4sSUFBY2pPLEtBQUssQ0FBQ2lILEtBQU4sQ0FBWXFDLGNBQTlCLEVBQThDO0FBQzVDO0FBQ0EsY0FBTTRFLEtBQU47QUFDRCxPQUphLENBS2Q7QUFDQTtBQUNBOzs7QUFDQSxhQUFPZCxPQUFPLENBQUNDLE9BQVIsRUFBUDtBQUNELEtBWEksRUFZSkwsSUFaSSxDQVlDLE1BQU07QUFDVixhQUFPO0FBQ0wvSCxRQUFBQSxTQURLO0FBRUwyQyxRQUFBQSxTQUZLO0FBR0xySCxRQUFBQTtBQUhLLE9BQVA7QUFLRCxLQWxCSSxDQUFQO0FBbUJEOztBQUVEd1AsRUFBQUEsWUFBWSxDQUFDeEksTUFBRCxFQUFjO0FBQ3hCLFNBQUssSUFBSXlKLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUd6SixNQUFNLENBQUN5QyxNQUEzQixFQUFtQ2dILENBQUMsSUFBSSxDQUF4QyxFQUEyQztBQUN6QyxZQUFNO0FBQUUvTCxRQUFBQSxTQUFGO0FBQWEyQyxRQUFBQTtBQUFiLFVBQTJCTCxNQUFNLENBQUN5SixDQUFELENBQXZDO0FBQ0EsVUFBSTtBQUFFelEsUUFBQUE7QUFBRixVQUFXZ0gsTUFBTSxDQUFDeUosQ0FBRCxDQUFyQjtBQUNBLFlBQU1ILFlBQVksR0FBRyxLQUFLQyxlQUFMLENBQXFCN0wsU0FBckIsRUFBZ0MyQyxTQUFoQyxDQUFyQjs7QUFDQSxVQUFJLE9BQU9ySCxJQUFQLEtBQWdCLFFBQXBCLEVBQThCO0FBQzVCQSxRQUFBQSxJQUFJLEdBQUc7QUFBRUEsVUFBQUEsSUFBSSxFQUFFQTtBQUFSLFNBQVA7QUFDRDs7QUFDRCxVQUFJLENBQUNzUSxZQUFELElBQWlCLENBQUNwRix1QkFBdUIsQ0FBQ29GLFlBQUQsRUFBZXRRLElBQWYsQ0FBN0MsRUFBbUU7QUFDakUsY0FBTSxJQUFJUCxLQUFLLENBQUNpSCxLQUFWLENBQWdCakgsS0FBSyxDQUFDaUgsS0FBTixDQUFZQyxZQUE1QixFQUEyQyx1QkFBc0JVLFNBQVUsRUFBM0UsQ0FBTjtBQUNEO0FBQ0Y7QUFDRixHQTFjbUMsQ0E0Y3BDOzs7QUFDQXFKLEVBQUFBLFdBQVcsQ0FBQ3JKLFNBQUQsRUFBb0IzQyxTQUFwQixFQUF1Q3dKLFFBQXZDLEVBQXFFO0FBQzlFLFdBQU8sS0FBS2EsWUFBTCxDQUFrQixDQUFDMUgsU0FBRCxDQUFsQixFQUErQjNDLFNBQS9CLEVBQTBDd0osUUFBMUMsQ0FBUDtBQUNELEdBL2NtQyxDQWlkcEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUNBYSxFQUFBQSxZQUFZLENBQUM0QixVQUFELEVBQTRCak0sU0FBNUIsRUFBK0N3SixRQUEvQyxFQUE2RTtBQUN2RixRQUFJLENBQUM5RixnQkFBZ0IsQ0FBQzFELFNBQUQsQ0FBckIsRUFBa0M7QUFDaEMsWUFBTSxJQUFJakYsS0FBSyxDQUFDaUgsS0FBVixDQUFnQmpILEtBQUssQ0FBQ2lILEtBQU4sQ0FBWW1DLGtCQUE1QixFQUFnREosdUJBQXVCLENBQUMvRCxTQUFELENBQXZFLENBQU47QUFDRDs7QUFFRGlNLElBQUFBLFVBQVUsQ0FBQzVHLE9BQVgsQ0FBbUIxQyxTQUFTLElBQUk7QUFDOUIsVUFBSSxDQUFDaUIsZ0JBQWdCLENBQUNqQixTQUFELEVBQVkzQyxTQUFaLENBQXJCLEVBQTZDO0FBQzNDLGNBQU0sSUFBSWpGLEtBQUssQ0FBQ2lILEtBQVYsQ0FBZ0JqSCxLQUFLLENBQUNpSCxLQUFOLENBQVltSixnQkFBNUIsRUFBK0MsdUJBQXNCeEksU0FBVSxFQUEvRSxDQUFOO0FBQ0QsT0FINkIsQ0FJOUI7OztBQUNBLFVBQUksQ0FBQ21CLHdCQUF3QixDQUFDbkIsU0FBRCxFQUFZM0MsU0FBWixDQUE3QixFQUFxRDtBQUNuRCxjQUFNLElBQUlqRixLQUFLLENBQUNpSCxLQUFWLENBQWdCLEdBQWhCLEVBQXNCLFNBQVFXLFNBQVUsb0JBQXhDLENBQU47QUFDRDtBQUNGLEtBUkQ7QUFVQSxXQUFPLEtBQUs0RixZQUFMLENBQWtCdkksU0FBbEIsRUFBNkIsS0FBN0IsRUFBb0M7QUFBRTJILE1BQUFBLFVBQVUsRUFBRTtBQUFkLEtBQXBDLEVBQ0pxRCxLQURJLENBQ0UvQixLQUFLLElBQUk7QUFDZCxVQUFJQSxLQUFLLEtBQUs3RSxTQUFkLEVBQXlCO0FBQ3ZCLGNBQU0sSUFBSXJKLEtBQUssQ0FBQ2lILEtBQVYsQ0FDSmpILEtBQUssQ0FBQ2lILEtBQU4sQ0FBWW1DLGtCQURSLEVBRUgsU0FBUW5FLFNBQVUsa0JBRmYsQ0FBTjtBQUlELE9BTEQsTUFLTztBQUNMLGNBQU1pSixLQUFOO0FBQ0Q7QUFDRixLQVZJLEVBV0psQixJQVhJLENBV0N4RCxNQUFNLElBQUk7QUFDZDBILE1BQUFBLFVBQVUsQ0FBQzVHLE9BQVgsQ0FBbUIxQyxTQUFTLElBQUk7QUFDOUIsWUFBSSxDQUFDNEIsTUFBTSxDQUFDakMsTUFBUCxDQUFjSyxTQUFkLENBQUwsRUFBK0I7QUFDN0IsZ0JBQU0sSUFBSTVILEtBQUssQ0FBQ2lILEtBQVYsQ0FBZ0IsR0FBaEIsRUFBc0IsU0FBUVcsU0FBVSxpQ0FBeEMsQ0FBTjtBQUNEO0FBQ0YsT0FKRDs7QUFNQSxZQUFNdUosWUFBWSxxQkFBUTNILE1BQU0sQ0FBQ2pDLE1BQWYsQ0FBbEI7O0FBQ0EsYUFBT2tILFFBQVEsQ0FBQzJDLE9BQVQsQ0FBaUI5QixZQUFqQixDQUE4QnJLLFNBQTlCLEVBQXlDdUUsTUFBekMsRUFBaUQwSCxVQUFqRCxFQUE2RGxFLElBQTdELENBQWtFLE1BQU07QUFDN0UsZUFBT0ksT0FBTyxDQUFDbEIsR0FBUixDQUNMZ0YsVUFBVSxDQUFDNUQsR0FBWCxDQUFlMUYsU0FBUyxJQUFJO0FBQzFCLGdCQUFNTSxLQUFLLEdBQUdpSixZQUFZLENBQUN2SixTQUFELENBQTFCOztBQUNBLGNBQUlNLEtBQUssSUFBSUEsS0FBSyxDQUFDM0gsSUFBTixLQUFlLFVBQTVCLEVBQXdDO0FBQ3RDO0FBQ0EsbUJBQU9rTyxRQUFRLENBQUMyQyxPQUFULENBQWlCQyxXQUFqQixDQUE4QixTQUFRekosU0FBVSxJQUFHM0MsU0FBVSxFQUE3RCxDQUFQO0FBQ0Q7O0FBQ0QsaUJBQU9tSSxPQUFPLENBQUNDLE9BQVIsRUFBUDtBQUNELFNBUEQsQ0FESyxDQUFQO0FBVUQsT0FYTSxDQUFQO0FBWUQsS0EvQkksRUFnQ0pMLElBaENJLENBZ0NDLE1BQU07QUFDVmYsMkJBQVl5QixLQUFaO0FBQ0QsS0FsQ0ksQ0FBUDtBQW1DRCxHQTFnQm1DLENBNGdCcEM7QUFDQTtBQUNBOzs7QUFDQSxRQUFNNEQsY0FBTixDQUFxQnJNLFNBQXJCLEVBQXdDc00sTUFBeEMsRUFBcURsTyxLQUFyRCxFQUFpRTtBQUMvRCxRQUFJbU8sUUFBUSxHQUFHLENBQWY7QUFDQSxVQUFNaEksTUFBTSxHQUFHLE1BQU0sS0FBSzBHLGtCQUFMLENBQXdCakwsU0FBeEIsQ0FBckI7QUFDQSxVQUFNdUssUUFBUSxHQUFHLEVBQWpCOztBQUVBLFNBQUssTUFBTTVILFNBQVgsSUFBd0IySixNQUF4QixFQUFnQztBQUM5QixVQUFJQSxNQUFNLENBQUMzSixTQUFELENBQU4sSUFBcUI0SSxPQUFPLENBQUNlLE1BQU0sQ0FBQzNKLFNBQUQsQ0FBUCxDQUFQLEtBQStCLFVBQXhELEVBQW9FO0FBQ2xFNEosUUFBQUEsUUFBUTtBQUNUOztBQUNELFVBQUlBLFFBQVEsR0FBRyxDQUFmLEVBQWtCO0FBQ2hCLGVBQU9wRSxPQUFPLENBQUNTLE1BQVIsQ0FDTCxJQUFJN04sS0FBSyxDQUFDaUgsS0FBVixDQUNFakgsS0FBSyxDQUFDaUgsS0FBTixDQUFZcUMsY0FEZCxFQUVFLGlEQUZGLENBREssQ0FBUDtBQU1EO0FBQ0Y7O0FBQ0QsU0FBSyxNQUFNMUIsU0FBWCxJQUF3QjJKLE1BQXhCLEVBQWdDO0FBQzlCLFVBQUlBLE1BQU0sQ0FBQzNKLFNBQUQsQ0FBTixLQUFzQnlCLFNBQTFCLEVBQXFDO0FBQ25DO0FBQ0Q7O0FBQ0QsWUFBTW9JLFFBQVEsR0FBR2pCLE9BQU8sQ0FBQ2UsTUFBTSxDQUFDM0osU0FBRCxDQUFQLENBQXhCOztBQUNBLFVBQUksQ0FBQzZKLFFBQUwsRUFBZTtBQUNiO0FBQ0Q7O0FBQ0QsVUFBSTdKLFNBQVMsS0FBSyxLQUFsQixFQUF5QjtBQUN2QjtBQUNBO0FBQ0Q7O0FBQ0Q0SCxNQUFBQSxRQUFRLENBQUNKLElBQVQsQ0FBYzVGLE1BQU0sQ0FBQ2lHLGtCQUFQLENBQTBCeEssU0FBMUIsRUFBcUMyQyxTQUFyQyxFQUFnRDZKLFFBQWhELENBQWQ7QUFDRDs7QUFDRCxVQUFNL0IsT0FBTyxHQUFHLE1BQU10QyxPQUFPLENBQUNsQixHQUFSLENBQVlzRCxRQUFaLENBQXRCO0FBQ0EsVUFBTUQsYUFBYSxHQUFHRyxPQUFPLENBQUNDLE1BQVIsQ0FBZUMsTUFBTSxJQUFJLENBQUMsQ0FBQ0EsTUFBM0IsQ0FBdEI7O0FBRUEsUUFBSUwsYUFBYSxDQUFDdkYsTUFBZCxLQUF5QixDQUE3QixFQUFnQztBQUM5QjtBQUNBLFlBQU0sS0FBSzJDLFVBQUwsQ0FBZ0I7QUFBRUMsUUFBQUEsVUFBVSxFQUFFO0FBQWQsT0FBaEIsQ0FBTjtBQUNEOztBQUNELFNBQUttRCxZQUFMLENBQWtCUixhQUFsQjtBQUVBLFVBQU1tQyxPQUFPLEdBQUd0RSxPQUFPLENBQUNDLE9BQVIsQ0FBZ0I3RCxNQUFoQixDQUFoQjtBQUNBLFdBQU9tSSwyQkFBMkIsQ0FBQ0QsT0FBRCxFQUFVek0sU0FBVixFQUFxQnNNLE1BQXJCLEVBQTZCbE8sS0FBN0IsQ0FBbEM7QUFDRCxHQTFqQm1DLENBNGpCcEM7OztBQUNBdU8sRUFBQUEsdUJBQXVCLENBQUMzTSxTQUFELEVBQW9Cc00sTUFBcEIsRUFBaUNsTyxLQUFqQyxFQUE2QztBQUNsRSxVQUFNd08sT0FBTyxHQUFHL0wsZUFBZSxDQUFDYixTQUFELENBQS9COztBQUNBLFFBQUksQ0FBQzRNLE9BQUQsSUFBWUEsT0FBTyxDQUFDN0gsTUFBUixJQUFrQixDQUFsQyxFQUFxQztBQUNuQyxhQUFPb0QsT0FBTyxDQUFDQyxPQUFSLENBQWdCLElBQWhCLENBQVA7QUFDRDs7QUFFRCxVQUFNeUUsY0FBYyxHQUFHRCxPQUFPLENBQUNsQyxNQUFSLENBQWUsVUFBVW9DLE1BQVYsRUFBa0I7QUFDdEQsVUFBSTFPLEtBQUssSUFBSUEsS0FBSyxDQUFDL0MsUUFBbkIsRUFBNkI7QUFDM0IsWUFBSWlSLE1BQU0sQ0FBQ1EsTUFBRCxDQUFOLElBQWtCLE9BQU9SLE1BQU0sQ0FBQ1EsTUFBRCxDQUFiLEtBQTBCLFFBQWhELEVBQTBEO0FBQ3hEO0FBQ0EsaUJBQU9SLE1BQU0sQ0FBQ1EsTUFBRCxDQUFOLENBQWVwRCxJQUFmLElBQXVCLFFBQTlCO0FBQ0QsU0FKMEIsQ0FLM0I7OztBQUNBLGVBQU8sS0FBUDtBQUNEOztBQUNELGFBQU8sQ0FBQzRDLE1BQU0sQ0FBQ1EsTUFBRCxDQUFkO0FBQ0QsS0FWc0IsQ0FBdkI7O0FBWUEsUUFBSUQsY0FBYyxDQUFDOUgsTUFBZixHQUF3QixDQUE1QixFQUErQjtBQUM3QixZQUFNLElBQUloSyxLQUFLLENBQUNpSCxLQUFWLENBQWdCakgsS0FBSyxDQUFDaUgsS0FBTixDQUFZcUMsY0FBNUIsRUFBNEN3SSxjQUFjLENBQUMsQ0FBRCxDQUFkLEdBQW9CLGVBQWhFLENBQU47QUFDRDs7QUFDRCxXQUFPMUUsT0FBTyxDQUFDQyxPQUFSLENBQWdCLElBQWhCLENBQVA7QUFDRDs7QUFFRDJFLEVBQUFBLDJCQUEyQixDQUFDL00sU0FBRCxFQUFvQmdOLFFBQXBCLEVBQXdDdkssU0FBeEMsRUFBMkQ7QUFDcEYsV0FBT21FLGdCQUFnQixDQUFDcUcsZUFBakIsQ0FDTCxLQUFLQyx3QkFBTCxDQUE4QmxOLFNBQTlCLENBREssRUFFTGdOLFFBRkssRUFHTHZLLFNBSEssQ0FBUDtBQUtELEdBM2xCbUMsQ0E2bEJwQzs7O0FBQ0EsU0FBT3dLLGVBQVAsQ0FBdUJFLGdCQUF2QixFQUErQ0gsUUFBL0MsRUFBbUV2SyxTQUFuRSxFQUErRjtBQUM3RixRQUFJLENBQUMwSyxnQkFBRCxJQUFxQixDQUFDQSxnQkFBZ0IsQ0FBQzFLLFNBQUQsQ0FBMUMsRUFBdUQ7QUFDckQsYUFBTyxJQUFQO0FBQ0Q7O0FBQ0QsVUFBTUosS0FBSyxHQUFHOEssZ0JBQWdCLENBQUMxSyxTQUFELENBQTlCOztBQUNBLFFBQUlKLEtBQUssQ0FBQyxHQUFELENBQVQsRUFBZ0I7QUFDZCxhQUFPLElBQVA7QUFDRCxLQVA0RixDQVE3Rjs7O0FBQ0EsUUFDRTJLLFFBQVEsQ0FBQ0ksSUFBVCxDQUFjQyxHQUFHLElBQUk7QUFDbkIsYUFBT2hMLEtBQUssQ0FBQ2dMLEdBQUQsQ0FBTCxLQUFlLElBQXRCO0FBQ0QsS0FGRCxDQURGLEVBSUU7QUFDQSxhQUFPLElBQVA7QUFDRDs7QUFDRCxXQUFPLEtBQVA7QUFDRCxHQS9tQm1DLENBaW5CcEM7OztBQUNBLFNBQU9DLGtCQUFQLENBQ0VILGdCQURGLEVBRUVuTixTQUZGLEVBR0VnTixRQUhGLEVBSUV2SyxTQUpGLEVBS0U4SyxNQUxGLEVBTUU7QUFDQSxRQUFJM0csZ0JBQWdCLENBQUNxRyxlQUFqQixDQUFpQ0UsZ0JBQWpDLEVBQW1ESCxRQUFuRCxFQUE2RHZLLFNBQTdELENBQUosRUFBNkU7QUFDM0UsYUFBTzBGLE9BQU8sQ0FBQ0MsT0FBUixFQUFQO0FBQ0Q7O0FBRUQsUUFBSSxDQUFDK0UsZ0JBQUQsSUFBcUIsQ0FBQ0EsZ0JBQWdCLENBQUMxSyxTQUFELENBQTFDLEVBQXVEO0FBQ3JELGFBQU8sSUFBUDtBQUNEOztBQUNELFVBQU1KLEtBQUssR0FBRzhLLGdCQUFnQixDQUFDMUssU0FBRCxDQUE5QixDQVJBLENBU0E7QUFDQTs7QUFDQSxRQUFJSixLQUFLLENBQUMsd0JBQUQsQ0FBVCxFQUFxQztBQUNuQztBQUNBLFVBQUksQ0FBQzJLLFFBQUQsSUFBYUEsUUFBUSxDQUFDakksTUFBVCxJQUFtQixDQUFwQyxFQUF1QztBQUNyQyxjQUFNLElBQUloSyxLQUFLLENBQUNpSCxLQUFWLENBQ0pqSCxLQUFLLENBQUNpSCxLQUFOLENBQVl3TCxnQkFEUixFQUVKLG9EQUZJLENBQU47QUFJRCxPQUxELE1BS08sSUFBSVIsUUFBUSxDQUFDeEssT0FBVCxDQUFpQixHQUFqQixJQUF3QixDQUFDLENBQXpCLElBQThCd0ssUUFBUSxDQUFDakksTUFBVCxJQUFtQixDQUFyRCxFQUF3RDtBQUM3RCxjQUFNLElBQUloSyxLQUFLLENBQUNpSCxLQUFWLENBQ0pqSCxLQUFLLENBQUNpSCxLQUFOLENBQVl3TCxnQkFEUixFQUVKLG9EQUZJLENBQU47QUFJRCxPQVprQyxDQWFuQztBQUNBOzs7QUFDQSxhQUFPckYsT0FBTyxDQUFDQyxPQUFSLEVBQVA7QUFDRCxLQTNCRCxDQTZCQTtBQUNBOzs7QUFDQSxVQUFNcUYsZUFBZSxHQUNuQixDQUFDLEtBQUQsRUFBUSxNQUFSLEVBQWdCLE9BQWhCLEVBQXlCakwsT0FBekIsQ0FBaUNDLFNBQWpDLElBQThDLENBQUMsQ0FBL0MsR0FBbUQsZ0JBQW5ELEdBQXNFLGlCQUR4RSxDQS9CQSxDQWtDQTs7QUFDQSxRQUFJZ0wsZUFBZSxJQUFJLGlCQUFuQixJQUF3Q2hMLFNBQVMsSUFBSSxRQUF6RCxFQUFtRTtBQUNqRSxZQUFNLElBQUkxSCxLQUFLLENBQUNpSCxLQUFWLENBQ0pqSCxLQUFLLENBQUNpSCxLQUFOLENBQVkwTCxtQkFEUixFQUVILGdDQUErQmpMLFNBQVUsYUFBWXpDLFNBQVUsR0FGNUQsQ0FBTjtBQUlELEtBeENELENBMENBOzs7QUFDQSxRQUNFK0MsS0FBSyxDQUFDQyxPQUFOLENBQWNtSyxnQkFBZ0IsQ0FBQ00sZUFBRCxDQUE5QixLQUNBTixnQkFBZ0IsQ0FBQ00sZUFBRCxDQUFoQixDQUFrQzFJLE1BQWxDLEdBQTJDLENBRjdDLEVBR0U7QUFDQSxhQUFPb0QsT0FBTyxDQUFDQyxPQUFSLEVBQVA7QUFDRDs7QUFFRCxVQUFNL0UsYUFBYSxHQUFHOEosZ0JBQWdCLENBQUMxSyxTQUFELENBQWhCLENBQTRCWSxhQUFsRDs7QUFDQSxRQUFJTixLQUFLLENBQUNDLE9BQU4sQ0FBY0ssYUFBZCxLQUFnQ0EsYUFBYSxDQUFDMEIsTUFBZCxHQUF1QixDQUEzRCxFQUE4RDtBQUM1RDtBQUNBLFVBQUl0QyxTQUFTLEtBQUssVUFBZCxJQUE0QjhLLE1BQU0sS0FBSyxRQUEzQyxFQUFxRDtBQUNuRDtBQUNBLGVBQU9wRixPQUFPLENBQUNDLE9BQVIsRUFBUDtBQUNEO0FBQ0Y7O0FBRUQsVUFBTSxJQUFJck4sS0FBSyxDQUFDaUgsS0FBVixDQUNKakgsS0FBSyxDQUFDaUgsS0FBTixDQUFZMEwsbUJBRFIsRUFFSCxnQ0FBK0JqTCxTQUFVLGFBQVl6QyxTQUFVLEdBRjVELENBQU47QUFJRCxHQXZyQm1DLENBeXJCcEM7OztBQUNBc04sRUFBQUEsa0JBQWtCLENBQUN0TixTQUFELEVBQW9CZ04sUUFBcEIsRUFBd0N2SyxTQUF4QyxFQUEyRDhLLE1BQTNELEVBQTRFO0FBQzVGLFdBQU8zRyxnQkFBZ0IsQ0FBQzBHLGtCQUFqQixDQUNMLEtBQUtKLHdCQUFMLENBQThCbE4sU0FBOUIsQ0FESyxFQUVMQSxTQUZLLEVBR0xnTixRQUhLLEVBSUx2SyxTQUpLLEVBS0w4SyxNQUxLLENBQVA7QUFPRDs7QUFFREwsRUFBQUEsd0JBQXdCLENBQUNsTixTQUFELEVBQXlCO0FBQy9DLFdBQU8sS0FBSytHLFVBQUwsQ0FBZ0IvRyxTQUFoQixLQUE4QixLQUFLK0csVUFBTCxDQUFnQi9HLFNBQWhCLEVBQTJCeUYscUJBQWhFO0FBQ0QsR0F0c0JtQyxDQXdzQnBDO0FBQ0E7OztBQUNBb0csRUFBQUEsZUFBZSxDQUFDN0wsU0FBRCxFQUFvQjJDLFNBQXBCLEVBQWdFO0FBQzdFLFFBQUksS0FBS29FLFVBQUwsQ0FBZ0IvRyxTQUFoQixDQUFKLEVBQWdDO0FBQzlCLFlBQU00TCxZQUFZLEdBQUcsS0FBSzdFLFVBQUwsQ0FBZ0IvRyxTQUFoQixFQUEyQnNDLE1BQTNCLENBQWtDSyxTQUFsQyxDQUFyQjtBQUNBLGFBQU9pSixZQUFZLEtBQUssS0FBakIsR0FBeUIsUUFBekIsR0FBb0NBLFlBQTNDO0FBQ0Q7O0FBQ0QsV0FBT3hILFNBQVA7QUFDRCxHQWh0Qm1DLENBa3RCcEM7OztBQUNBdUosRUFBQUEsUUFBUSxDQUFDM04sU0FBRCxFQUFvQjtBQUMxQixRQUFJLEtBQUsrRyxVQUFMLENBQWdCL0csU0FBaEIsQ0FBSixFQUFnQztBQUM5QixhQUFPbUksT0FBTyxDQUFDQyxPQUFSLENBQWdCLElBQWhCLENBQVA7QUFDRDs7QUFDRCxXQUFPLEtBQUtWLFVBQUwsR0FBa0JLLElBQWxCLENBQXVCLE1BQU0sQ0FBQyxDQUFDLEtBQUtoQixVQUFMLENBQWdCL0csU0FBaEIsQ0FBL0IsQ0FBUDtBQUNEOztBQXh0Qm1DLEMsQ0EydEJ0Qzs7Ozs7QUFDQSxNQUFNNE4sSUFBSSxHQUFHLENBQUNDLFNBQUQsRUFBNEJqRyxPQUE1QixLQUF3RTtBQUNuRixRQUFNckQsTUFBTSxHQUFHLElBQUlxQyxnQkFBSixDQUFxQmlILFNBQXJCLENBQWY7QUFDQSxTQUFPdEosTUFBTSxDQUFDbUQsVUFBUCxDQUFrQkUsT0FBbEIsRUFBMkJHLElBQTNCLENBQWdDLE1BQU14RCxNQUF0QyxDQUFQO0FBQ0QsQ0FIRCxDLENBS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUFDQSxTQUFTcUYsdUJBQVQsQ0FBaUNILGNBQWpDLEVBQStEcUUsVUFBL0QsRUFBOEY7QUFDNUYsUUFBTW5FLFNBQVMsR0FBRyxFQUFsQixDQUQ0RixDQUU1Rjs7QUFDQSxRQUFNb0UsY0FBYyxHQUNsQjdTLE1BQU0sQ0FBQzRKLElBQVAsQ0FBWTdKLGNBQVosRUFBNEJ1SCxPQUE1QixDQUFvQ2lILGNBQWMsQ0FBQ3VFLEdBQW5ELE1BQTRELENBQUMsQ0FBN0QsR0FDSSxFQURKLEdBRUk5UyxNQUFNLENBQUM0SixJQUFQLENBQVk3SixjQUFjLENBQUN3TyxjQUFjLENBQUN1RSxHQUFoQixDQUExQixDQUhOOztBQUlBLE9BQUssTUFBTUMsUUFBWCxJQUF1QnhFLGNBQXZCLEVBQXVDO0FBQ3JDLFFBQ0V3RSxRQUFRLEtBQUssS0FBYixJQUNBQSxRQUFRLEtBQUssS0FEYixJQUVBQSxRQUFRLEtBQUssV0FGYixJQUdBQSxRQUFRLEtBQUssV0FIYixJQUlBQSxRQUFRLEtBQUssVUFMZixFQU1FO0FBQ0EsVUFBSUYsY0FBYyxDQUFDaEosTUFBZixHQUF3QixDQUF4QixJQUE2QmdKLGNBQWMsQ0FBQ3ZMLE9BQWYsQ0FBdUJ5TCxRQUF2QixNQUFxQyxDQUFDLENBQXZFLEVBQTBFO0FBQ3hFO0FBQ0Q7O0FBQ0QsWUFBTUMsY0FBYyxHQUFHSixVQUFVLENBQUNHLFFBQUQsQ0FBVixJQUF3QkgsVUFBVSxDQUFDRyxRQUFELENBQVYsQ0FBcUJ2RSxJQUFyQixLQUE4QixRQUE3RTs7QUFDQSxVQUFJLENBQUN3RSxjQUFMLEVBQXFCO0FBQ25CdkUsUUFBQUEsU0FBUyxDQUFDc0UsUUFBRCxDQUFULEdBQXNCeEUsY0FBYyxDQUFDd0UsUUFBRCxDQUFwQztBQUNEO0FBQ0Y7QUFDRjs7QUFDRCxPQUFLLE1BQU1FLFFBQVgsSUFBdUJMLFVBQXZCLEVBQW1DO0FBQ2pDLFFBQUlLLFFBQVEsS0FBSyxVQUFiLElBQTJCTCxVQUFVLENBQUNLLFFBQUQsQ0FBVixDQUFxQnpFLElBQXJCLEtBQThCLFFBQTdELEVBQXVFO0FBQ3JFLFVBQUlxRSxjQUFjLENBQUNoSixNQUFmLEdBQXdCLENBQXhCLElBQTZCZ0osY0FBYyxDQUFDdkwsT0FBZixDQUF1QjJMLFFBQXZCLE1BQXFDLENBQUMsQ0FBdkUsRUFBMEU7QUFDeEU7QUFDRDs7QUFDRHhFLE1BQUFBLFNBQVMsQ0FBQ3dFLFFBQUQsQ0FBVCxHQUFzQkwsVUFBVSxDQUFDSyxRQUFELENBQWhDO0FBQ0Q7QUFDRjs7QUFDRCxTQUFPeEUsU0FBUDtBQUNELEMsQ0FFRDtBQUNBOzs7QUFDQSxTQUFTK0MsMkJBQVQsQ0FBcUMwQixhQUFyQyxFQUFvRHBPLFNBQXBELEVBQStEc00sTUFBL0QsRUFBdUVsTyxLQUF2RSxFQUE4RTtBQUM1RSxTQUFPZ1EsYUFBYSxDQUFDckcsSUFBZCxDQUFtQnhELE1BQU0sSUFBSTtBQUNsQyxXQUFPQSxNQUFNLENBQUNvSSx1QkFBUCxDQUErQjNNLFNBQS9CLEVBQTBDc00sTUFBMUMsRUFBa0RsTyxLQUFsRCxDQUFQO0FBQ0QsR0FGTSxDQUFQO0FBR0QsQyxDQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUNBLFNBQVNtTixPQUFULENBQWlCOEMsR0FBakIsRUFBb0Q7QUFDbEQsUUFBTS9TLElBQUksR0FBRyxPQUFPK1MsR0FBcEI7O0FBQ0EsVUFBUS9TLElBQVI7QUFDRSxTQUFLLFNBQUw7QUFDRSxhQUFPLFNBQVA7O0FBQ0YsU0FBSyxRQUFMO0FBQ0UsYUFBTyxRQUFQOztBQUNGLFNBQUssUUFBTDtBQUNFLGFBQU8sUUFBUDs7QUFDRixTQUFLLEtBQUw7QUFDQSxTQUFLLFFBQUw7QUFDRSxVQUFJLENBQUMrUyxHQUFMLEVBQVU7QUFDUixlQUFPakssU0FBUDtBQUNEOztBQUNELGFBQU9rSyxhQUFhLENBQUNELEdBQUQsQ0FBcEI7O0FBQ0YsU0FBSyxVQUFMO0FBQ0EsU0FBSyxRQUFMO0FBQ0EsU0FBSyxXQUFMO0FBQ0E7QUFDRSxZQUFNLGNBQWNBLEdBQXBCO0FBakJKO0FBbUJELEMsQ0FFRDtBQUNBO0FBQ0E7OztBQUNBLFNBQVNDLGFBQVQsQ0FBdUJELEdBQXZCLEVBQXFEO0FBQ25ELE1BQUlBLEdBQUcsWUFBWXRMLEtBQW5CLEVBQTBCO0FBQ3hCLFdBQU8sT0FBUDtBQUNEOztBQUNELE1BQUlzTCxHQUFHLENBQUNFLE1BQVIsRUFBZ0I7QUFDZCxZQUFRRixHQUFHLENBQUNFLE1BQVo7QUFDRSxXQUFLLFNBQUw7QUFDRSxZQUFJRixHQUFHLENBQUNyTyxTQUFSLEVBQW1CO0FBQ2pCLGlCQUFPO0FBQ0wxRSxZQUFBQSxJQUFJLEVBQUUsU0FERDtBQUVMMkIsWUFBQUEsV0FBVyxFQUFFb1IsR0FBRyxDQUFDck87QUFGWixXQUFQO0FBSUQ7O0FBQ0Q7O0FBQ0YsV0FBSyxVQUFMO0FBQ0UsWUFBSXFPLEdBQUcsQ0FBQ3JPLFNBQVIsRUFBbUI7QUFDakIsaUJBQU87QUFDTDFFLFlBQUFBLElBQUksRUFBRSxVQUREO0FBRUwyQixZQUFBQSxXQUFXLEVBQUVvUixHQUFHLENBQUNyTztBQUZaLFdBQVA7QUFJRDs7QUFDRDs7QUFDRixXQUFLLE1BQUw7QUFDRSxZQUFJcU8sR0FBRyxDQUFDdFIsSUFBUixFQUFjO0FBQ1osaUJBQU8sTUFBUDtBQUNEOztBQUNEOztBQUNGLFdBQUssTUFBTDtBQUNFLFlBQUlzUixHQUFHLENBQUNHLEdBQVIsRUFBYTtBQUNYLGlCQUFPLE1BQVA7QUFDRDs7QUFDRDs7QUFDRixXQUFLLFVBQUw7QUFDRSxZQUFJSCxHQUFHLENBQUNJLFFBQUosSUFBZ0IsSUFBaEIsSUFBd0JKLEdBQUcsQ0FBQ0ssU0FBSixJQUFpQixJQUE3QyxFQUFtRDtBQUNqRCxpQkFBTyxVQUFQO0FBQ0Q7O0FBQ0Q7O0FBQ0YsV0FBSyxPQUFMO0FBQ0UsWUFBSUwsR0FBRyxDQUFDTSxNQUFSLEVBQWdCO0FBQ2QsaUJBQU8sT0FBUDtBQUNEOztBQUNEOztBQUNGLFdBQUssU0FBTDtBQUNFLFlBQUlOLEdBQUcsQ0FBQ08sV0FBUixFQUFxQjtBQUNuQixpQkFBTyxTQUFQO0FBQ0Q7O0FBQ0Q7QUF6Q0o7O0FBMkNBLFVBQU0sSUFBSTdULEtBQUssQ0FBQ2lILEtBQVYsQ0FBZ0JqSCxLQUFLLENBQUNpSCxLQUFOLENBQVlxQyxjQUE1QixFQUE0Qyx5QkFBeUJnSyxHQUFHLENBQUNFLE1BQXpFLENBQU47QUFDRDs7QUFDRCxNQUFJRixHQUFHLENBQUMsS0FBRCxDQUFQLEVBQWdCO0FBQ2QsV0FBT0MsYUFBYSxDQUFDRCxHQUFHLENBQUMsS0FBRCxDQUFKLENBQXBCO0FBQ0Q7O0FBQ0QsTUFBSUEsR0FBRyxDQUFDM0UsSUFBUixFQUFjO0FBQ1osWUFBUTJFLEdBQUcsQ0FBQzNFLElBQVo7QUFDRSxXQUFLLFdBQUw7QUFDRSxlQUFPLFFBQVA7O0FBQ0YsV0FBSyxRQUFMO0FBQ0UsZUFBTyxJQUFQOztBQUNGLFdBQUssS0FBTDtBQUNBLFdBQUssV0FBTDtBQUNBLFdBQUssUUFBTDtBQUNFLGVBQU8sT0FBUDs7QUFDRixXQUFLLGFBQUw7QUFDQSxXQUFLLGdCQUFMO0FBQ0UsZUFBTztBQUNMcE8sVUFBQUEsSUFBSSxFQUFFLFVBREQ7QUFFTDJCLFVBQUFBLFdBQVcsRUFBRW9SLEdBQUcsQ0FBQ1EsT0FBSixDQUFZLENBQVosRUFBZTdPO0FBRnZCLFNBQVA7O0FBSUYsV0FBSyxPQUFMO0FBQ0UsZUFBT3NPLGFBQWEsQ0FBQ0QsR0FBRyxDQUFDUyxHQUFKLENBQVEsQ0FBUixDQUFELENBQXBCOztBQUNGO0FBQ0UsY0FBTSxvQkFBb0JULEdBQUcsQ0FBQzNFLElBQTlCO0FBbEJKO0FBb0JEOztBQUNELFNBQU8sUUFBUDtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQGZsb3dcbi8vIFRoaXMgY2xhc3MgaGFuZGxlcyBzY2hlbWEgdmFsaWRhdGlvbiwgcGVyc2lzdGVuY2UsIGFuZCBtb2RpZmljYXRpb24uXG4vL1xuLy8gRWFjaCBpbmRpdmlkdWFsIFNjaGVtYSBvYmplY3Qgc2hvdWxkIGJlIGltbXV0YWJsZS4gVGhlIGhlbHBlcnMgdG9cbi8vIGRvIHRoaW5ncyB3aXRoIHRoZSBTY2hlbWEganVzdCByZXR1cm4gYSBuZXcgc2NoZW1hIHdoZW4gdGhlIHNjaGVtYVxuLy8gaXMgY2hhbmdlZC5cbi8vXG4vLyBUaGUgY2Fub25pY2FsIHBsYWNlIHRvIHN0b3JlIHRoaXMgU2NoZW1hIGlzIGluIHRoZSBkYXRhYmFzZSBpdHNlbGYsXG4vLyBpbiBhIF9TQ0hFTUEgY29sbGVjdGlvbi4gVGhpcyBpcyBub3QgdGhlIHJpZ2h0IHdheSB0byBkbyBpdCBmb3IgYW5cbi8vIG9wZW4gc291cmNlIGZyYW1ld29yaywgYnV0IGl0J3MgYmFja3dhcmQgY29tcGF0aWJsZSwgc28gd2UncmVcbi8vIGtlZXBpbmcgaXQgdGhpcyB3YXkgZm9yIG5vdy5cbi8vXG4vLyBJbiBBUEktaGFuZGxpbmcgY29kZSwgeW91IHNob3VsZCBvbmx5IHVzZSB0aGUgU2NoZW1hIGNsYXNzIHZpYSB0aGVcbi8vIERhdGFiYXNlQ29udHJvbGxlci4gVGhpcyB3aWxsIGxldCB1cyByZXBsYWNlIHRoZSBzY2hlbWEgbG9naWMgZm9yXG4vLyBkaWZmZXJlbnQgZGF0YWJhc2VzLlxuLy8gVE9ETzogaGlkZSBhbGwgc2NoZW1hIGxvZ2ljIGluc2lkZSB0aGUgZGF0YWJhc2UgYWRhcHRlci5cbi8vIEBmbG93LWRpc2FibGUtbmV4dFxuY29uc3QgUGFyc2UgPSByZXF1aXJlKCdwYXJzZS9ub2RlJykuUGFyc2U7XG5pbXBvcnQgeyBTdG9yYWdlQWRhcHRlciB9IGZyb20gJy4uL0FkYXB0ZXJzL1N0b3JhZ2UvU3RvcmFnZUFkYXB0ZXInO1xuaW1wb3J0IFNjaGVtYUNhY2hlIGZyb20gJy4uL0FkYXB0ZXJzL0NhY2hlL1NjaGVtYUNhY2hlJztcbmltcG9ydCBEYXRhYmFzZUNvbnRyb2xsZXIgZnJvbSAnLi9EYXRhYmFzZUNvbnRyb2xsZXInO1xuaW1wb3J0IENvbmZpZyBmcm9tICcuLi9Db25maWcnO1xuLy8gQGZsb3ctZGlzYWJsZS1uZXh0XG5pbXBvcnQgZGVlcGNvcHkgZnJvbSAnZGVlcGNvcHknO1xuaW1wb3J0IHR5cGUge1xuICBTY2hlbWEsXG4gIFNjaGVtYUZpZWxkcyxcbiAgQ2xhc3NMZXZlbFBlcm1pc3Npb25zLFxuICBTY2hlbWFGaWVsZCxcbiAgTG9hZFNjaGVtYU9wdGlvbnMsXG59IGZyb20gJy4vdHlwZXMnO1xuXG5jb25zdCBkZWZhdWx0Q29sdW1uczogeyBbc3RyaW5nXTogU2NoZW1hRmllbGRzIH0gPSBPYmplY3QuZnJlZXplKHtcbiAgLy8gQ29udGFpbiB0aGUgZGVmYXVsdCBjb2x1bW5zIGZvciBldmVyeSBwYXJzZSBvYmplY3QgdHlwZSAoZXhjZXB0IF9Kb2luIGNvbGxlY3Rpb24pXG4gIF9EZWZhdWx0OiB7XG4gICAgb2JqZWN0SWQ6IHsgdHlwZTogJ1N0cmluZycgfSxcbiAgICBjcmVhdGVkQXQ6IHsgdHlwZTogJ0RhdGUnIH0sXG4gICAgdXBkYXRlZEF0OiB7IHR5cGU6ICdEYXRlJyB9LFxuICAgIEFDTDogeyB0eXBlOiAnQUNMJyB9LFxuICB9LFxuICAvLyBUaGUgYWRkaXRpb25hbCBkZWZhdWx0IGNvbHVtbnMgZm9yIHRoZSBfVXNlciBjb2xsZWN0aW9uIChpbiBhZGRpdGlvbiB0byBEZWZhdWx0Q29scylcbiAgX1VzZXI6IHtcbiAgICB1c2VybmFtZTogeyB0eXBlOiAnU3RyaW5nJyB9LFxuICAgIHBhc3N3b3JkOiB7IHR5cGU6ICdTdHJpbmcnIH0sXG4gICAgZW1haWw6IHsgdHlwZTogJ1N0cmluZycgfSxcbiAgICBlbWFpbFZlcmlmaWVkOiB7IHR5cGU6ICdCb29sZWFuJyB9LFxuICAgIGF1dGhEYXRhOiB7IHR5cGU6ICdPYmplY3QnIH0sXG4gIH0sXG4gIC8vIFRoZSBhZGRpdGlvbmFsIGRlZmF1bHQgY29sdW1ucyBmb3IgdGhlIF9JbnN0YWxsYXRpb24gY29sbGVjdGlvbiAoaW4gYWRkaXRpb24gdG8gRGVmYXVsdENvbHMpXG4gIF9JbnN0YWxsYXRpb246IHtcbiAgICBpbnN0YWxsYXRpb25JZDogeyB0eXBlOiAnU3RyaW5nJyB9LFxuICAgIGRldmljZVRva2VuOiB7IHR5cGU6ICdTdHJpbmcnIH0sXG4gICAgY2hhbm5lbHM6IHsgdHlwZTogJ0FycmF5JyB9LFxuICAgIGRldmljZVR5cGU6IHsgdHlwZTogJ1N0cmluZycgfSxcbiAgICBwdXNoVHlwZTogeyB0eXBlOiAnU3RyaW5nJyB9LFxuICAgIEdDTVNlbmRlcklkOiB7IHR5cGU6ICdTdHJpbmcnIH0sXG4gICAgdGltZVpvbmU6IHsgdHlwZTogJ1N0cmluZycgfSxcbiAgICBsb2NhbGVJZGVudGlmaWVyOiB7IHR5cGU6ICdTdHJpbmcnIH0sXG4gICAgYmFkZ2U6IHsgdHlwZTogJ051bWJlcicgfSxcbiAgICBhcHBWZXJzaW9uOiB7IHR5cGU6ICdTdHJpbmcnIH0sXG4gICAgYXBwTmFtZTogeyB0eXBlOiAnU3RyaW5nJyB9LFxuICAgIGFwcElkZW50aWZpZXI6IHsgdHlwZTogJ1N0cmluZycgfSxcbiAgICBwYXJzZVZlcnNpb246IHsgdHlwZTogJ1N0cmluZycgfSxcbiAgfSxcbiAgLy8gVGhlIGFkZGl0aW9uYWwgZGVmYXVsdCBjb2x1bW5zIGZvciB0aGUgX1JvbGUgY29sbGVjdGlvbiAoaW4gYWRkaXRpb24gdG8gRGVmYXVsdENvbHMpXG4gIF9Sb2xlOiB7XG4gICAgbmFtZTogeyB0eXBlOiAnU3RyaW5nJyB9LFxuICAgIHVzZXJzOiB7IHR5cGU6ICdSZWxhdGlvbicsIHRhcmdldENsYXNzOiAnX1VzZXInIH0sXG4gICAgcm9sZXM6IHsgdHlwZTogJ1JlbGF0aW9uJywgdGFyZ2V0Q2xhc3M6ICdfUm9sZScgfSxcbiAgfSxcbiAgLy8gVGhlIGFkZGl0aW9uYWwgZGVmYXVsdCBjb2x1bW5zIGZvciB0aGUgX1Nlc3Npb24gY29sbGVjdGlvbiAoaW4gYWRkaXRpb24gdG8gRGVmYXVsdENvbHMpXG4gIF9TZXNzaW9uOiB7XG4gICAgcmVzdHJpY3RlZDogeyB0eXBlOiAnQm9vbGVhbicgfSxcbiAgICB1c2VyOiB7IHR5cGU6ICdQb2ludGVyJywgdGFyZ2V0Q2xhc3M6ICdfVXNlcicgfSxcbiAgICBpbnN0YWxsYXRpb25JZDogeyB0eXBlOiAnU3RyaW5nJyB9LFxuICAgIHNlc3Npb25Ub2tlbjogeyB0eXBlOiAnU3RyaW5nJyB9LFxuICAgIGV4cGlyZXNBdDogeyB0eXBlOiAnRGF0ZScgfSxcbiAgICBjcmVhdGVkV2l0aDogeyB0eXBlOiAnT2JqZWN0JyB9LFxuICB9LFxuICBfUHJvZHVjdDoge1xuICAgIHByb2R1Y3RJZGVudGlmaWVyOiB7IHR5cGU6ICdTdHJpbmcnIH0sXG4gICAgZG93bmxvYWQ6IHsgdHlwZTogJ0ZpbGUnIH0sXG4gICAgZG93bmxvYWROYW1lOiB7IHR5cGU6ICdTdHJpbmcnIH0sXG4gICAgaWNvbjogeyB0eXBlOiAnRmlsZScgfSxcbiAgICBvcmRlcjogeyB0eXBlOiAnTnVtYmVyJyB9LFxuICAgIHRpdGxlOiB7IHR5cGU6ICdTdHJpbmcnIH0sXG4gICAgc3VidGl0bGU6IHsgdHlwZTogJ1N0cmluZycgfSxcbiAgfSxcbiAgX1B1c2hTdGF0dXM6IHtcbiAgICBwdXNoVGltZTogeyB0eXBlOiAnU3RyaW5nJyB9LFxuICAgIHNvdXJjZTogeyB0eXBlOiAnU3RyaW5nJyB9LCAvLyByZXN0IG9yIHdlYnVpXG4gICAgcXVlcnk6IHsgdHlwZTogJ1N0cmluZycgfSwgLy8gdGhlIHN0cmluZ2lmaWVkIEpTT04gcXVlcnlcbiAgICBwYXlsb2FkOiB7IHR5cGU6ICdTdHJpbmcnIH0sIC8vIHRoZSBzdHJpbmdpZmllZCBKU09OIHBheWxvYWQsXG4gICAgdGl0bGU6IHsgdHlwZTogJ1N0cmluZycgfSxcbiAgICBleHBpcnk6IHsgdHlwZTogJ051bWJlcicgfSxcbiAgICBleHBpcmF0aW9uX2ludGVydmFsOiB7IHR5cGU6ICdOdW1iZXInIH0sXG4gICAgc3RhdHVzOiB7IHR5cGU6ICdTdHJpbmcnIH0sXG4gICAgbnVtU2VudDogeyB0eXBlOiAnTnVtYmVyJyB9LFxuICAgIG51bUZhaWxlZDogeyB0eXBlOiAnTnVtYmVyJyB9LFxuICAgIHB1c2hIYXNoOiB7IHR5cGU6ICdTdHJpbmcnIH0sXG4gICAgZXJyb3JNZXNzYWdlOiB7IHR5cGU6ICdPYmplY3QnIH0sXG4gICAgc2VudFBlclR5cGU6IHsgdHlwZTogJ09iamVjdCcgfSxcbiAgICBmYWlsZWRQZXJUeXBlOiB7IHR5cGU6ICdPYmplY3QnIH0sXG4gICAgc2VudFBlclVUQ09mZnNldDogeyB0eXBlOiAnT2JqZWN0JyB9LFxuICAgIGZhaWxlZFBlclVUQ09mZnNldDogeyB0eXBlOiAnT2JqZWN0JyB9LFxuICAgIGNvdW50OiB7IHR5cGU6ICdOdW1iZXInIH0sIC8vIHRyYWNrcyAjIG9mIGJhdGNoZXMgcXVldWVkIGFuZCBwZW5kaW5nXG4gIH0sXG4gIF9Kb2JTdGF0dXM6IHtcbiAgICBqb2JOYW1lOiB7IHR5cGU6ICdTdHJpbmcnIH0sXG4gICAgc291cmNlOiB7IHR5cGU6ICdTdHJpbmcnIH0sXG4gICAgc3RhdHVzOiB7IHR5cGU6ICdTdHJpbmcnIH0sXG4gICAgbWVzc2FnZTogeyB0eXBlOiAnU3RyaW5nJyB9LFxuICAgIHBhcmFtczogeyB0eXBlOiAnT2JqZWN0JyB9LCAvLyBwYXJhbXMgcmVjZWl2ZWQgd2hlbiBjYWxsaW5nIHRoZSBqb2JcbiAgICBmaW5pc2hlZEF0OiB7IHR5cGU6ICdEYXRlJyB9LFxuICB9LFxuICBfSm9iU2NoZWR1bGU6IHtcbiAgICBqb2JOYW1lOiB7IHR5cGU6ICdTdHJpbmcnIH0sXG4gICAgZGVzY3JpcHRpb246IHsgdHlwZTogJ1N0cmluZycgfSxcbiAgICBwYXJhbXM6IHsgdHlwZTogJ1N0cmluZycgfSxcbiAgICBzdGFydEFmdGVyOiB7IHR5cGU6ICdTdHJpbmcnIH0sXG4gICAgZGF5c09mV2VlazogeyB0eXBlOiAnQXJyYXknIH0sXG4gICAgdGltZU9mRGF5OiB7IHR5cGU6ICdTdHJpbmcnIH0sXG4gICAgbGFzdFJ1bjogeyB0eXBlOiAnTnVtYmVyJyB9LFxuICAgIHJlcGVhdE1pbnV0ZXM6IHsgdHlwZTogJ051bWJlcicgfSxcbiAgfSxcbiAgX0hvb2tzOiB7XG4gICAgZnVuY3Rpb25OYW1lOiB7IHR5cGU6ICdTdHJpbmcnIH0sXG4gICAgY2xhc3NOYW1lOiB7IHR5cGU6ICdTdHJpbmcnIH0sXG4gICAgdHJpZ2dlck5hbWU6IHsgdHlwZTogJ1N0cmluZycgfSxcbiAgICB1cmw6IHsgdHlwZTogJ1N0cmluZycgfSxcbiAgfSxcbiAgX0dsb2JhbENvbmZpZzoge1xuICAgIG9iamVjdElkOiB7IHR5cGU6ICdTdHJpbmcnIH0sXG4gICAgcGFyYW1zOiB7IHR5cGU6ICdPYmplY3QnIH0sXG4gICAgbWFzdGVyS2V5T25seTogeyB0eXBlOiAnT2JqZWN0JyB9LFxuICB9LFxuICBfR3JhcGhRTENvbmZpZzoge1xuICAgIG9iamVjdElkOiB7IHR5cGU6ICdTdHJpbmcnIH0sXG4gICAgY29uZmlnOiB7IHR5cGU6ICdPYmplY3QnIH0sXG4gIH0sXG4gIF9BdWRpZW5jZToge1xuICAgIG9iamVjdElkOiB7IHR5cGU6ICdTdHJpbmcnIH0sXG4gICAgbmFtZTogeyB0eXBlOiAnU3RyaW5nJyB9LFxuICAgIHF1ZXJ5OiB7IHR5cGU6ICdTdHJpbmcnIH0sIC8vc3RvcmluZyBxdWVyeSBhcyBKU09OIHN0cmluZyB0byBwcmV2ZW50IFwiTmVzdGVkIGtleXMgc2hvdWxkIG5vdCBjb250YWluIHRoZSAnJCcgb3IgJy4nIGNoYXJhY3RlcnNcIiBlcnJvclxuICAgIGxhc3RVc2VkOiB7IHR5cGU6ICdEYXRlJyB9LFxuICAgIHRpbWVzVXNlZDogeyB0eXBlOiAnTnVtYmVyJyB9LFxuICB9LFxuICBfSWRlbXBvdGVuY3k6IHtcbiAgICByZXFJZDogeyB0eXBlOiAnU3RyaW5nJyB9LFxuICAgIGV4cGlyZTogeyB0eXBlOiAnRGF0ZScgfSxcbiAgfSxcbn0pO1xuXG5jb25zdCByZXF1aXJlZENvbHVtbnMgPSBPYmplY3QuZnJlZXplKHtcbiAgX1Byb2R1Y3Q6IFsncHJvZHVjdElkZW50aWZpZXInLCAnaWNvbicsICdvcmRlcicsICd0aXRsZScsICdzdWJ0aXRsZSddLFxuICBfUm9sZTogWyduYW1lJywgJ0FDTCddLFxufSk7XG5cbmNvbnN0IGludmFsaWRDb2x1bW5zID0gWydsZW5ndGgnXTtcblxuY29uc3Qgc3lzdGVtQ2xhc3NlcyA9IE9iamVjdC5mcmVlemUoW1xuICAnX1VzZXInLFxuICAnX0luc3RhbGxhdGlvbicsXG4gICdfUm9sZScsXG4gICdfU2Vzc2lvbicsXG4gICdfUHJvZHVjdCcsXG4gICdfUHVzaFN0YXR1cycsXG4gICdfSm9iU3RhdHVzJyxcbiAgJ19Kb2JTY2hlZHVsZScsXG4gICdfQXVkaWVuY2UnLFxuICAnX0lkZW1wb3RlbmN5Jyxcbl0pO1xuXG5jb25zdCB2b2xhdGlsZUNsYXNzZXMgPSBPYmplY3QuZnJlZXplKFtcbiAgJ19Kb2JTdGF0dXMnLFxuICAnX1B1c2hTdGF0dXMnLFxuICAnX0hvb2tzJyxcbiAgJ19HbG9iYWxDb25maWcnLFxuICAnX0dyYXBoUUxDb25maWcnLFxuICAnX0pvYlNjaGVkdWxlJyxcbiAgJ19BdWRpZW5jZScsXG4gICdfSWRlbXBvdGVuY3knLFxuXSk7XG5cbi8vIEFueXRoaW5nIHRoYXQgc3RhcnQgd2l0aCByb2xlXG5jb25zdCByb2xlUmVnZXggPSAvXnJvbGU6LiovO1xuLy8gQW55dGhpbmcgdGhhdCBzdGFydHMgd2l0aCB1c2VyRmllbGQgKGFsbG93ZWQgZm9yIHByb3RlY3RlZCBmaWVsZHMgb25seSlcbmNvbnN0IHByb3RlY3RlZEZpZWxkc1BvaW50ZXJSZWdleCA9IC9edXNlckZpZWxkOi4qLztcbi8vICogcGVybWlzc2lvblxuY29uc3QgcHVibGljUmVnZXggPSAvXlxcKiQvO1xuXG5jb25zdCBhdXRoZW50aWNhdGVkUmVnZXggPSAvXmF1dGhlbnRpY2F0ZWQkLztcblxuY29uc3QgcmVxdWlyZXNBdXRoZW50aWNhdGlvblJlZ2V4ID0gL15yZXF1aXJlc0F1dGhlbnRpY2F0aW9uJC87XG5cbmNvbnN0IGNscFBvaW50ZXJSZWdleCA9IC9ecG9pbnRlckZpZWxkcyQvO1xuXG4vLyByZWdleCBmb3IgdmFsaWRhdGluZyBlbnRpdGllcyBpbiBwcm90ZWN0ZWRGaWVsZHMgb2JqZWN0XG5jb25zdCBwcm90ZWN0ZWRGaWVsZHNSZWdleCA9IE9iamVjdC5mcmVlemUoW1xuICBwcm90ZWN0ZWRGaWVsZHNQb2ludGVyUmVnZXgsXG4gIHB1YmxpY1JlZ2V4LFxuICBhdXRoZW50aWNhdGVkUmVnZXgsXG4gIHJvbGVSZWdleCxcbl0pO1xuXG4vLyBjbHAgcmVnZXhcbmNvbnN0IGNscEZpZWxkc1JlZ2V4ID0gT2JqZWN0LmZyZWV6ZShbXG4gIGNscFBvaW50ZXJSZWdleCxcbiAgcHVibGljUmVnZXgsXG4gIHJlcXVpcmVzQXV0aGVudGljYXRpb25SZWdleCxcbiAgcm9sZVJlZ2V4LFxuXSk7XG5cbmZ1bmN0aW9uIHZhbGlkYXRlUGVybWlzc2lvbktleShrZXksIHVzZXJJZFJlZ0V4cCkge1xuICBsZXQgbWF0Y2hlc1NvbWUgPSBmYWxzZTtcbiAgZm9yIChjb25zdCByZWdFeCBvZiBjbHBGaWVsZHNSZWdleCkge1xuICAgIGlmIChrZXkubWF0Y2gocmVnRXgpICE9PSBudWxsKSB7XG4gICAgICBtYXRjaGVzU29tZSA9IHRydWU7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICAvLyB1c2VySWQgZGVwZW5kcyBvbiBzdGFydHVwIG9wdGlvbnMgc28gaXQncyBkeW5hbWljXG4gIGNvbnN0IHZhbGlkID0gbWF0Y2hlc1NvbWUgfHwga2V5Lm1hdGNoKHVzZXJJZFJlZ0V4cCkgIT09IG51bGw7XG4gIGlmICghdmFsaWQpIHtcbiAgICB0aHJvdyBuZXcgUGFyc2UuRXJyb3IoXG4gICAgICBQYXJzZS5FcnJvci5JTlZBTElEX0pTT04sXG4gICAgICBgJyR7a2V5fScgaXMgbm90IGEgdmFsaWQga2V5IGZvciBjbGFzcyBsZXZlbCBwZXJtaXNzaW9uc2BcbiAgICApO1xuICB9XG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlUHJvdGVjdGVkRmllbGRzS2V5KGtleSwgdXNlcklkUmVnRXhwKSB7XG4gIGxldCBtYXRjaGVzU29tZSA9IGZhbHNlO1xuICBmb3IgKGNvbnN0IHJlZ0V4IG9mIHByb3RlY3RlZEZpZWxkc1JlZ2V4KSB7XG4gICAgaWYgKGtleS5tYXRjaChyZWdFeCkgIT09IG51bGwpIHtcbiAgICAgIG1hdGNoZXNTb21lID0gdHJ1ZTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIC8vIHVzZXJJZCByZWdleCBkZXBlbmRzIG9uIGxhdW5jaCBvcHRpb25zIHNvIGl0J3MgZHluYW1pY1xuICBjb25zdCB2YWxpZCA9IG1hdGNoZXNTb21lIHx8IGtleS5tYXRjaCh1c2VySWRSZWdFeHApICE9PSBudWxsO1xuICBpZiAoIXZhbGlkKSB7XG4gICAgdGhyb3cgbmV3IFBhcnNlLkVycm9yKFxuICAgICAgUGFyc2UuRXJyb3IuSU5WQUxJRF9KU09OLFxuICAgICAgYCcke2tleX0nIGlzIG5vdCBhIHZhbGlkIGtleSBmb3IgY2xhc3MgbGV2ZWwgcGVybWlzc2lvbnNgXG4gICAgKTtcbiAgfVxufVxuXG5jb25zdCBDTFBWYWxpZEtleXMgPSBPYmplY3QuZnJlZXplKFtcbiAgJ2ZpbmQnLFxuICAnY291bnQnLFxuICAnZ2V0JyxcbiAgJ2NyZWF0ZScsXG4gICd1cGRhdGUnLFxuICAnZGVsZXRlJyxcbiAgJ2FkZEZpZWxkJyxcbiAgJ3JlYWRVc2VyRmllbGRzJyxcbiAgJ3dyaXRlVXNlckZpZWxkcycsXG4gICdwcm90ZWN0ZWRGaWVsZHMnLFxuXSk7XG5cbi8vIHZhbGlkYXRpb24gYmVmb3JlIHNldHRpbmcgY2xhc3MtbGV2ZWwgcGVybWlzc2lvbnMgb24gY29sbGVjdGlvblxuZnVuY3Rpb24gdmFsaWRhdGVDTFAocGVybXM6IENsYXNzTGV2ZWxQZXJtaXNzaW9ucywgZmllbGRzOiBTY2hlbWFGaWVsZHMsIHVzZXJJZFJlZ0V4cDogUmVnRXhwKSB7XG4gIGlmICghcGVybXMpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgZm9yIChjb25zdCBvcGVyYXRpb25LZXkgaW4gcGVybXMpIHtcbiAgICBpZiAoQ0xQVmFsaWRLZXlzLmluZGV4T2Yob3BlcmF0aW9uS2V5KSA9PSAtMSkge1xuICAgICAgdGhyb3cgbmV3IFBhcnNlLkVycm9yKFxuICAgICAgICBQYXJzZS5FcnJvci5JTlZBTElEX0pTT04sXG4gICAgICAgIGAke29wZXJhdGlvbktleX0gaXMgbm90IGEgdmFsaWQgb3BlcmF0aW9uIGZvciBjbGFzcyBsZXZlbCBwZXJtaXNzaW9uc2BcbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3Qgb3BlcmF0aW9uID0gcGVybXNbb3BlcmF0aW9uS2V5XTtcbiAgICAvLyBwcm9jZWVkIHdpdGggbmV4dCBvcGVyYXRpb25LZXlcblxuICAgIC8vIHRocm93cyB3aGVuIHJvb3QgZmllbGRzIGFyZSBvZiB3cm9uZyB0eXBlXG4gICAgdmFsaWRhdGVDTFBqc29uKG9wZXJhdGlvbiwgb3BlcmF0aW9uS2V5KTtcblxuICAgIGlmIChvcGVyYXRpb25LZXkgPT09ICdyZWFkVXNlckZpZWxkcycgfHwgb3BlcmF0aW9uS2V5ID09PSAnd3JpdGVVc2VyRmllbGRzJykge1xuICAgICAgLy8gdmFsaWRhdGUgZ3JvdXBlZCBwb2ludGVyIHBlcm1pc3Npb25zXG4gICAgICAvLyBtdXN0IGJlIGFuIGFycmF5IHdpdGggZmllbGQgbmFtZXNcbiAgICAgIGZvciAoY29uc3QgZmllbGROYW1lIG9mIG9wZXJhdGlvbikge1xuICAgICAgICB2YWxpZGF0ZVBvaW50ZXJQZXJtaXNzaW9uKGZpZWxkTmFtZSwgZmllbGRzLCBvcGVyYXRpb25LZXkpO1xuICAgICAgfVxuICAgICAgLy8gcmVhZFVzZXJGaWVsZHMgYW5kIHdyaXRlclVzZXJGaWVsZHMgZG8gbm90IGhhdmUgbmVzZHRlZCBmaWVsZHNcbiAgICAgIC8vIHByb2NlZWQgd2l0aCBuZXh0IG9wZXJhdGlvbktleVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gdmFsaWRhdGUgcHJvdGVjdGVkIGZpZWxkc1xuICAgIGlmIChvcGVyYXRpb25LZXkgPT09ICdwcm90ZWN0ZWRGaWVsZHMnKSB7XG4gICAgICBmb3IgKGNvbnN0IGVudGl0eSBpbiBvcGVyYXRpb24pIHtcbiAgICAgICAgLy8gdGhyb3dzIG9uIHVuZXhwZWN0ZWQga2V5XG4gICAgICAgIHZhbGlkYXRlUHJvdGVjdGVkRmllbGRzS2V5KGVudGl0eSwgdXNlcklkUmVnRXhwKTtcblxuICAgICAgICBjb25zdCBwcm90ZWN0ZWRGaWVsZHMgPSBvcGVyYXRpb25bZW50aXR5XTtcblxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkocHJvdGVjdGVkRmllbGRzKSkge1xuICAgICAgICAgIHRocm93IG5ldyBQYXJzZS5FcnJvcihcbiAgICAgICAgICAgIFBhcnNlLkVycm9yLklOVkFMSURfSlNPTixcbiAgICAgICAgICAgIGAnJHtwcm90ZWN0ZWRGaWVsZHN9JyBpcyBub3QgYSB2YWxpZCB2YWx1ZSBmb3IgcHJvdGVjdGVkRmllbGRzWyR7ZW50aXR5fV0gLSBleHBlY3RlZCBhbiBhcnJheS5gXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIHRoZSBmaWVsZCBpcyBpbiBmb3JtIG9mIGFycmF5XG4gICAgICAgIGZvciAoY29uc3QgZmllbGQgb2YgcHJvdGVjdGVkRmllbGRzKSB7XG4gICAgICAgICAgLy8gZG8gbm90IGFsbG9vdyB0byBwcm90ZWN0IGRlZmF1bHQgZmllbGRzXG4gICAgICAgICAgaWYgKGRlZmF1bHRDb2x1bW5zLl9EZWZhdWx0W2ZpZWxkXSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFBhcnNlLkVycm9yKFxuICAgICAgICAgICAgICBQYXJzZS5FcnJvci5JTlZBTElEX0pTT04sXG4gICAgICAgICAgICAgIGBEZWZhdWx0IGZpZWxkICcke2ZpZWxkfScgY2FuIG5vdCBiZSBwcm90ZWN0ZWRgXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBmaWVsZCBzaG91bGQgZXhpc3Qgb24gY29sbGVjdGlvblxuICAgICAgICAgIGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGZpZWxkcywgZmllbGQpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgUGFyc2UuRXJyb3IoXG4gICAgICAgICAgICAgIFBhcnNlLkVycm9yLklOVkFMSURfSlNPTixcbiAgICAgICAgICAgICAgYEZpZWxkICcke2ZpZWxkfScgaW4gcHJvdGVjdGVkRmllbGRzOiR7ZW50aXR5fSBkb2VzIG5vdCBleGlzdGBcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBwcm9jZWVkIHdpdGggbmV4dCBvcGVyYXRpb25LZXlcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIHZhbGlkYXRlIG90aGVyIGZpZWxkc1xuICAgIC8vIEVudGl0eSBjYW4gYmU6XG4gICAgLy8gXCIqXCIgLSBQdWJsaWMsXG4gICAgLy8gXCJyZXF1aXJlc0F1dGhlbnRpY2F0aW9uXCIgLSBhdXRoZW50aWNhdGVkIHVzZXJzLFxuICAgIC8vIFwib2JqZWN0SWRcIiAtIF9Vc2VyIGlkLFxuICAgIC8vIFwicm9sZTpyb2xlbmFtZVwiLFxuICAgIC8vIFwicG9pbnRlckZpZWxkc1wiIC0gYXJyYXkgb2YgZmllbGQgbmFtZXMgY29udGFpbmluZyBwb2ludGVycyB0byB1c2Vyc1xuICAgIGZvciAoY29uc3QgZW50aXR5IGluIG9wZXJhdGlvbikge1xuICAgICAgLy8gdGhyb3dzIG9uIHVuZXhwZWN0ZWQga2V5XG4gICAgICB2YWxpZGF0ZVBlcm1pc3Npb25LZXkoZW50aXR5LCB1c2VySWRSZWdFeHApO1xuXG4gICAgICAvLyBlbnRpdHkgY2FuIGJlIGVpdGhlcjpcbiAgICAgIC8vIFwicG9pbnRlckZpZWxkc1wiOiBzdHJpbmdbXVxuICAgICAgaWYgKGVudGl0eSA9PT0gJ3BvaW50ZXJGaWVsZHMnKSB7XG4gICAgICAgIGNvbnN0IHBvaW50ZXJGaWVsZHMgPSBvcGVyYXRpb25bZW50aXR5XTtcblxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShwb2ludGVyRmllbGRzKSkge1xuICAgICAgICAgIGZvciAoY29uc3QgcG9pbnRlckZpZWxkIG9mIHBvaW50ZXJGaWVsZHMpIHtcbiAgICAgICAgICAgIHZhbGlkYXRlUG9pbnRlclBlcm1pc3Npb24ocG9pbnRlckZpZWxkLCBmaWVsZHMsIG9wZXJhdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBQYXJzZS5FcnJvcihcbiAgICAgICAgICAgIFBhcnNlLkVycm9yLklOVkFMSURfSlNPTixcbiAgICAgICAgICAgIGAnJHtwb2ludGVyRmllbGRzfScgaXMgbm90IGEgdmFsaWQgdmFsdWUgZm9yICR7b3BlcmF0aW9uS2V5fVske2VudGl0eX1dIC0gZXhwZWN0ZWQgYW4gYXJyYXkuYFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gcHJvY2VlZCB3aXRoIG5leHQgZW50aXR5IGtleVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gb3IgW2VudGl0eV06IGJvb2xlYW5cbiAgICAgIGNvbnN0IHBlcm1pdCA9IG9wZXJhdGlvbltlbnRpdHldO1xuXG4gICAgICBpZiAocGVybWl0ICE9PSB0cnVlKSB7XG4gICAgICAgIHRocm93IG5ldyBQYXJzZS5FcnJvcihcbiAgICAgICAgICBQYXJzZS5FcnJvci5JTlZBTElEX0pTT04sXG4gICAgICAgICAgYCcke3Blcm1pdH0nIGlzIG5vdCBhIHZhbGlkIHZhbHVlIGZvciBjbGFzcyBsZXZlbCBwZXJtaXNzaW9ucyAke29wZXJhdGlvbktleX06JHtlbnRpdHl9OiR7cGVybWl0fWBcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVDTFBqc29uKG9wZXJhdGlvbjogYW55LCBvcGVyYXRpb25LZXk6IHN0cmluZykge1xuICBpZiAob3BlcmF0aW9uS2V5ID09PSAncmVhZFVzZXJGaWVsZHMnIHx8IG9wZXJhdGlvbktleSA9PT0gJ3dyaXRlVXNlckZpZWxkcycpIHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkob3BlcmF0aW9uKSkge1xuICAgICAgdGhyb3cgbmV3IFBhcnNlLkVycm9yKFxuICAgICAgICBQYXJzZS5FcnJvci5JTlZBTElEX0pTT04sXG4gICAgICAgIGAnJHtvcGVyYXRpb259JyBpcyBub3QgYSB2YWxpZCB2YWx1ZSBmb3IgY2xhc3MgbGV2ZWwgcGVybWlzc2lvbnMgJHtvcGVyYXRpb25LZXl9IC0gbXVzdCBiZSBhbiBhcnJheWBcbiAgICAgICk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmICh0eXBlb2Ygb3BlcmF0aW9uID09PSAnb2JqZWN0JyAmJiBvcGVyYXRpb24gIT09IG51bGwpIHtcbiAgICAgIC8vIG9rIHRvIHByb2NlZWRcbiAgICAgIHJldHVybjtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IFBhcnNlLkVycm9yKFxuICAgICAgICBQYXJzZS5FcnJvci5JTlZBTElEX0pTT04sXG4gICAgICAgIGAnJHtvcGVyYXRpb259JyBpcyBub3QgYSB2YWxpZCB2YWx1ZSBmb3IgY2xhc3MgbGV2ZWwgcGVybWlzc2lvbnMgJHtvcGVyYXRpb25LZXl9IC0gbXVzdCBiZSBhbiBvYmplY3RgXG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZVBvaW50ZXJQZXJtaXNzaW9uKGZpZWxkTmFtZTogc3RyaW5nLCBmaWVsZHM6IE9iamVjdCwgb3BlcmF0aW9uOiBzdHJpbmcpIHtcbiAgLy8gVXNlcyBjb2xsZWN0aW9uIHNjaGVtYSB0byBlbnN1cmUgdGhlIGZpZWxkIGlzIG9mIHR5cGU6XG4gIC8vIC0gUG9pbnRlcjxfVXNlcj4gKHBvaW50ZXJzKVxuICAvLyAtIEFycmF5XG4gIC8vXG4gIC8vICAgIEl0J3Mgbm90IHBvc3NpYmxlIHRvIGVuZm9yY2UgdHlwZSBvbiBBcnJheSdzIGl0ZW1zIGluIHNjaGVtYVxuICAvLyAgc28gd2UgYWNjZXB0IGFueSBBcnJheSBmaWVsZCwgYW5kIGxhdGVyIHdoZW4gYXBwbHlpbmcgcGVybWlzc2lvbnNcbiAgLy8gIG9ubHkgaXRlbXMgdGhhdCBhcmUgcG9pbnRlcnMgdG8gX1VzZXIgYXJlIGNvbnNpZGVyZWQuXG4gIGlmIChcbiAgICAhKFxuICAgICAgZmllbGRzW2ZpZWxkTmFtZV0gJiZcbiAgICAgICgoZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PSAnUG9pbnRlcicgJiYgZmllbGRzW2ZpZWxkTmFtZV0udGFyZ2V0Q2xhc3MgPT0gJ19Vc2VyJykgfHxcbiAgICAgICAgZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PSAnQXJyYXknKVxuICAgIClcbiAgKSB7XG4gICAgdGhyb3cgbmV3IFBhcnNlLkVycm9yKFxuICAgICAgUGFyc2UuRXJyb3IuSU5WQUxJRF9KU09OLFxuICAgICAgYCcke2ZpZWxkTmFtZX0nIGlzIG5vdCBhIHZhbGlkIGNvbHVtbiBmb3IgY2xhc3MgbGV2ZWwgcG9pbnRlciBwZXJtaXNzaW9ucyAke29wZXJhdGlvbn1gXG4gICAgKTtcbiAgfVxufVxuXG5jb25zdCBqb2luQ2xhc3NSZWdleCA9IC9eX0pvaW46W0EtWmEtejAtOV9dKzpbQS1aYS16MC05X10rLztcbmNvbnN0IGNsYXNzQW5kRmllbGRSZWdleCA9IC9eW0EtWmEtel1bQS1aYS16MC05X10qJC87XG5mdW5jdGlvbiBjbGFzc05hbWVJc1ZhbGlkKGNsYXNzTmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gIC8vIFZhbGlkIGNsYXNzZXMgbXVzdDpcbiAgcmV0dXJuIChcbiAgICAvLyBCZSBvbmUgb2YgX1VzZXIsIF9JbnN0YWxsYXRpb24sIF9Sb2xlLCBfU2Vzc2lvbiBPUlxuICAgIHN5c3RlbUNsYXNzZXMuaW5kZXhPZihjbGFzc05hbWUpID4gLTEgfHxcbiAgICAvLyBCZSBhIGpvaW4gdGFibGUgT1JcbiAgICBqb2luQ2xhc3NSZWdleC50ZXN0KGNsYXNzTmFtZSkgfHxcbiAgICAvLyBJbmNsdWRlIG9ubHkgYWxwaGEtbnVtZXJpYyBhbmQgdW5kZXJzY29yZXMsIGFuZCBub3Qgc3RhcnQgd2l0aCBhbiB1bmRlcnNjb3JlIG9yIG51bWJlclxuICAgIGZpZWxkTmFtZUlzVmFsaWQoY2xhc3NOYW1lLCBjbGFzc05hbWUpXG4gICk7XG59XG5cbi8vIFZhbGlkIGZpZWxkcyBtdXN0IGJlIGFscGhhLW51bWVyaWMsIGFuZCBub3Qgc3RhcnQgd2l0aCBhbiB1bmRlcnNjb3JlIG9yIG51bWJlclxuLy8gbXVzdCBub3QgYmUgYSByZXNlcnZlZCBrZXlcbmZ1bmN0aW9uIGZpZWxkTmFtZUlzVmFsaWQoZmllbGROYW1lOiBzdHJpbmcsIGNsYXNzTmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGlmIChjbGFzc05hbWUgJiYgY2xhc3NOYW1lICE9PSAnX0hvb2tzJykge1xuICAgIGlmIChmaWVsZE5hbWUgPT09ICdjbGFzc05hbWUnKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiBjbGFzc0FuZEZpZWxkUmVnZXgudGVzdChmaWVsZE5hbWUpICYmICFpbnZhbGlkQ29sdW1ucy5pbmNsdWRlcyhmaWVsZE5hbWUpO1xufVxuXG4vLyBDaGVja3MgdGhhdCBpdCdzIG5vdCB0cnlpbmcgdG8gY2xvYmJlciBvbmUgb2YgdGhlIGRlZmF1bHQgZmllbGRzIG9mIHRoZSBjbGFzcy5cbmZ1bmN0aW9uIGZpZWxkTmFtZUlzVmFsaWRGb3JDbGFzcyhmaWVsZE5hbWU6IHN0cmluZywgY2xhc3NOYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgaWYgKCFmaWVsZE5hbWVJc1ZhbGlkKGZpZWxkTmFtZSwgY2xhc3NOYW1lKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoZGVmYXVsdENvbHVtbnMuX0RlZmF1bHRbZmllbGROYW1lXSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoZGVmYXVsdENvbHVtbnNbY2xhc3NOYW1lXSAmJiBkZWZhdWx0Q29sdW1uc1tjbGFzc05hbWVdW2ZpZWxkTmFtZV0pIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGludmFsaWRDbGFzc05hbWVNZXNzYWdlKGNsYXNzTmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIChcbiAgICAnSW52YWxpZCBjbGFzc25hbWU6ICcgK1xuICAgIGNsYXNzTmFtZSArXG4gICAgJywgY2xhc3NuYW1lcyBjYW4gb25seSBoYXZlIGFscGhhbnVtZXJpYyBjaGFyYWN0ZXJzIGFuZCBfLCBhbmQgbXVzdCBzdGFydCB3aXRoIGFuIGFscGhhIGNoYXJhY3RlciAnXG4gICk7XG59XG5cbmNvbnN0IGludmFsaWRKc29uRXJyb3IgPSBuZXcgUGFyc2UuRXJyb3IoUGFyc2UuRXJyb3IuSU5WQUxJRF9KU09OLCAnaW52YWxpZCBKU09OJyk7XG5jb25zdCB2YWxpZE5vblJlbGF0aW9uT3JQb2ludGVyVHlwZXMgPSBbXG4gICdOdW1iZXInLFxuICAnU3RyaW5nJyxcbiAgJ0Jvb2xlYW4nLFxuICAnRGF0ZScsXG4gICdPYmplY3QnLFxuICAnQXJyYXknLFxuICAnR2VvUG9pbnQnLFxuICAnRmlsZScsXG4gICdCeXRlcycsXG4gICdQb2x5Z29uJyxcbl07XG4vLyBSZXR1cm5zIGFuIGVycm9yIHN1aXRhYmxlIGZvciB0aHJvd2luZyBpZiB0aGUgdHlwZSBpcyBpbnZhbGlkXG5jb25zdCBmaWVsZFR5cGVJc0ludmFsaWQgPSAoeyB0eXBlLCB0YXJnZXRDbGFzcyB9KSA9PiB7XG4gIGlmIChbJ1BvaW50ZXInLCAnUmVsYXRpb24nXS5pbmRleE9mKHR5cGUpID49IDApIHtcbiAgICBpZiAoIXRhcmdldENsYXNzKSB7XG4gICAgICByZXR1cm4gbmV3IFBhcnNlLkVycm9yKDEzNSwgYHR5cGUgJHt0eXBlfSBuZWVkcyBhIGNsYXNzIG5hbWVgKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB0YXJnZXRDbGFzcyAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiBpbnZhbGlkSnNvbkVycm9yO1xuICAgIH0gZWxzZSBpZiAoIWNsYXNzTmFtZUlzVmFsaWQodGFyZ2V0Q2xhc3MpKSB7XG4gICAgICByZXR1cm4gbmV3IFBhcnNlLkVycm9yKFBhcnNlLkVycm9yLklOVkFMSURfQ0xBU1NfTkFNRSwgaW52YWxpZENsYXNzTmFtZU1lc3NhZ2UodGFyZ2V0Q2xhc3MpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gIH1cbiAgaWYgKHR5cGVvZiB0eXBlICE9PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBpbnZhbGlkSnNvbkVycm9yO1xuICB9XG4gIGlmICh2YWxpZE5vblJlbGF0aW9uT3JQb2ludGVyVHlwZXMuaW5kZXhPZih0eXBlKSA8IDApIHtcbiAgICByZXR1cm4gbmV3IFBhcnNlLkVycm9yKFBhcnNlLkVycm9yLklOQ09SUkVDVF9UWVBFLCBgaW52YWxpZCBmaWVsZCB0eXBlOiAke3R5cGV9YCk7XG4gIH1cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn07XG5cbmNvbnN0IGNvbnZlcnRTY2hlbWFUb0FkYXB0ZXJTY2hlbWEgPSAoc2NoZW1hOiBhbnkpID0+IHtcbiAgc2NoZW1hID0gaW5qZWN0RGVmYXVsdFNjaGVtYShzY2hlbWEpO1xuICBkZWxldGUgc2NoZW1hLmZpZWxkcy5BQ0w7XG4gIHNjaGVtYS5maWVsZHMuX3JwZXJtID0geyB0eXBlOiAnQXJyYXknIH07XG4gIHNjaGVtYS5maWVsZHMuX3dwZXJtID0geyB0eXBlOiAnQXJyYXknIH07XG5cbiAgaWYgKHNjaGVtYS5jbGFzc05hbWUgPT09ICdfVXNlcicpIHtcbiAgICBkZWxldGUgc2NoZW1hLmZpZWxkcy5wYXNzd29yZDtcbiAgICBzY2hlbWEuZmllbGRzLl9oYXNoZWRfcGFzc3dvcmQgPSB7IHR5cGU6ICdTdHJpbmcnIH07XG4gIH1cblxuICByZXR1cm4gc2NoZW1hO1xufTtcblxuY29uc3QgY29udmVydEFkYXB0ZXJTY2hlbWFUb1BhcnNlU2NoZW1hID0gKHsgLi4uc2NoZW1hIH0pID0+IHtcbiAgZGVsZXRlIHNjaGVtYS5maWVsZHMuX3JwZXJtO1xuICBkZWxldGUgc2NoZW1hLmZpZWxkcy5fd3Blcm07XG5cbiAgc2NoZW1hLmZpZWxkcy5BQ0wgPSB7IHR5cGU6ICdBQ0wnIH07XG5cbiAgaWYgKHNjaGVtYS5jbGFzc05hbWUgPT09ICdfVXNlcicpIHtcbiAgICBkZWxldGUgc2NoZW1hLmZpZWxkcy5hdXRoRGF0YTsgLy9BdXRoIGRhdGEgaXMgaW1wbGljaXRcbiAgICBkZWxldGUgc2NoZW1hLmZpZWxkcy5faGFzaGVkX3Bhc3N3b3JkO1xuICAgIHNjaGVtYS5maWVsZHMucGFzc3dvcmQgPSB7IHR5cGU6ICdTdHJpbmcnIH07XG4gIH1cblxuICBpZiAoc2NoZW1hLmluZGV4ZXMgJiYgT2JqZWN0LmtleXMoc2NoZW1hLmluZGV4ZXMpLmxlbmd0aCA9PT0gMCkge1xuICAgIGRlbGV0ZSBzY2hlbWEuaW5kZXhlcztcbiAgfVxuXG4gIHJldHVybiBzY2hlbWE7XG59O1xuXG5jbGFzcyBTY2hlbWFEYXRhIHtcbiAgX19kYXRhOiBhbnk7XG4gIF9fcHJvdGVjdGVkRmllbGRzOiBhbnk7XG4gIGNvbnN0cnVjdG9yKGFsbFNjaGVtYXMgPSBbXSwgcHJvdGVjdGVkRmllbGRzID0ge30pIHtcbiAgICB0aGlzLl9fZGF0YSA9IHt9O1xuICAgIHRoaXMuX19wcm90ZWN0ZWRGaWVsZHMgPSBwcm90ZWN0ZWRGaWVsZHM7XG4gICAgYWxsU2NoZW1hcy5mb3JFYWNoKHNjaGVtYSA9PiB7XG4gICAgICBpZiAodm9sYXRpbGVDbGFzc2VzLmluY2x1ZGVzKHNjaGVtYS5jbGFzc05hbWUpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBzY2hlbWEuY2xhc3NOYW1lLCB7XG4gICAgICAgIGdldDogKCkgPT4ge1xuICAgICAgICAgIGlmICghdGhpcy5fX2RhdGFbc2NoZW1hLmNsYXNzTmFtZV0pIHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSB7fTtcbiAgICAgICAgICAgIGRhdGEuZmllbGRzID0gaW5qZWN0RGVmYXVsdFNjaGVtYShzY2hlbWEpLmZpZWxkcztcbiAgICAgICAgICAgIGRhdGEuY2xhc3NMZXZlbFBlcm1pc3Npb25zID0gZGVlcGNvcHkoc2NoZW1hLmNsYXNzTGV2ZWxQZXJtaXNzaW9ucyk7XG4gICAgICAgICAgICBkYXRhLmluZGV4ZXMgPSBzY2hlbWEuaW5kZXhlcztcblxuICAgICAgICAgICAgY29uc3QgY2xhc3NQcm90ZWN0ZWRGaWVsZHMgPSB0aGlzLl9fcHJvdGVjdGVkRmllbGRzW3NjaGVtYS5jbGFzc05hbWVdO1xuICAgICAgICAgICAgaWYgKGNsYXNzUHJvdGVjdGVkRmllbGRzKSB7XG4gICAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIGNsYXNzUHJvdGVjdGVkRmllbGRzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdW5xID0gbmV3IFNldChbXG4gICAgICAgICAgICAgICAgICAuLi4oZGF0YS5jbGFzc0xldmVsUGVybWlzc2lvbnMucHJvdGVjdGVkRmllbGRzW2tleV0gfHwgW10pLFxuICAgICAgICAgICAgICAgICAgLi4uY2xhc3NQcm90ZWN0ZWRGaWVsZHNba2V5XSxcbiAgICAgICAgICAgICAgICBdKTtcbiAgICAgICAgICAgICAgICBkYXRhLmNsYXNzTGV2ZWxQZXJtaXNzaW9ucy5wcm90ZWN0ZWRGaWVsZHNba2V5XSA9IEFycmF5LmZyb20odW5xKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLl9fZGF0YVtzY2hlbWEuY2xhc3NOYW1lXSA9IGRhdGE7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0aGlzLl9fZGF0YVtzY2hlbWEuY2xhc3NOYW1lXTtcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLy8gSW5qZWN0IHRoZSBpbi1tZW1vcnkgY2xhc3Nlc1xuICAgIHZvbGF0aWxlQ2xhc3Nlcy5mb3JFYWNoKGNsYXNzTmFtZSA9PiB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgY2xhc3NOYW1lLCB7XG4gICAgICAgIGdldDogKCkgPT4ge1xuICAgICAgICAgIGlmICghdGhpcy5fX2RhdGFbY2xhc3NOYW1lXSkge1xuICAgICAgICAgICAgY29uc3Qgc2NoZW1hID0gaW5qZWN0RGVmYXVsdFNjaGVtYSh7XG4gICAgICAgICAgICAgIGNsYXNzTmFtZSxcbiAgICAgICAgICAgICAgZmllbGRzOiB7fSxcbiAgICAgICAgICAgICAgY2xhc3NMZXZlbFBlcm1pc3Npb25zOiB7fSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IHt9O1xuICAgICAgICAgICAgZGF0YS5maWVsZHMgPSBzY2hlbWEuZmllbGRzO1xuICAgICAgICAgICAgZGF0YS5jbGFzc0xldmVsUGVybWlzc2lvbnMgPSBzY2hlbWEuY2xhc3NMZXZlbFBlcm1pc3Npb25zO1xuICAgICAgICAgICAgZGF0YS5pbmRleGVzID0gc2NoZW1hLmluZGV4ZXM7XG4gICAgICAgICAgICB0aGlzLl9fZGF0YVtjbGFzc05hbWVdID0gZGF0YTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRoaXMuX19kYXRhW2NsYXNzTmFtZV07XG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5jb25zdCBpbmplY3REZWZhdWx0U2NoZW1hID0gKHsgY2xhc3NOYW1lLCBmaWVsZHMsIGNsYXNzTGV2ZWxQZXJtaXNzaW9ucywgaW5kZXhlcyB9OiBTY2hlbWEpID0+IHtcbiAgY29uc3QgZGVmYXVsdFNjaGVtYTogU2NoZW1hID0ge1xuICAgIGNsYXNzTmFtZSxcbiAgICBmaWVsZHM6IHtcbiAgICAgIC4uLmRlZmF1bHRDb2x1bW5zLl9EZWZhdWx0LFxuICAgICAgLi4uKGRlZmF1bHRDb2x1bW5zW2NsYXNzTmFtZV0gfHwge30pLFxuICAgICAgLi4uZmllbGRzLFxuICAgIH0sXG4gICAgY2xhc3NMZXZlbFBlcm1pc3Npb25zLFxuICB9O1xuICBpZiAoaW5kZXhlcyAmJiBPYmplY3Qua2V5cyhpbmRleGVzKS5sZW5ndGggIT09IDApIHtcbiAgICBkZWZhdWx0U2NoZW1hLmluZGV4ZXMgPSBpbmRleGVzO1xuICB9XG4gIHJldHVybiBkZWZhdWx0U2NoZW1hO1xufTtcblxuY29uc3QgX0hvb2tzU2NoZW1hID0geyBjbGFzc05hbWU6ICdfSG9va3MnLCBmaWVsZHM6IGRlZmF1bHRDb2x1bW5zLl9Ib29rcyB9O1xuY29uc3QgX0dsb2JhbENvbmZpZ1NjaGVtYSA9IHtcbiAgY2xhc3NOYW1lOiAnX0dsb2JhbENvbmZpZycsXG4gIGZpZWxkczogZGVmYXVsdENvbHVtbnMuX0dsb2JhbENvbmZpZyxcbn07XG5jb25zdCBfR3JhcGhRTENvbmZpZ1NjaGVtYSA9IHtcbiAgY2xhc3NOYW1lOiAnX0dyYXBoUUxDb25maWcnLFxuICBmaWVsZHM6IGRlZmF1bHRDb2x1bW5zLl9HcmFwaFFMQ29uZmlnLFxufTtcbmNvbnN0IF9QdXNoU3RhdHVzU2NoZW1hID0gY29udmVydFNjaGVtYVRvQWRhcHRlclNjaGVtYShcbiAgaW5qZWN0RGVmYXVsdFNjaGVtYSh7XG4gICAgY2xhc3NOYW1lOiAnX1B1c2hTdGF0dXMnLFxuICAgIGZpZWxkczoge30sXG4gICAgY2xhc3NMZXZlbFBlcm1pc3Npb25zOiB7fSxcbiAgfSlcbik7XG5jb25zdCBfSm9iU3RhdHVzU2NoZW1hID0gY29udmVydFNjaGVtYVRvQWRhcHRlclNjaGVtYShcbiAgaW5qZWN0RGVmYXVsdFNjaGVtYSh7XG4gICAgY2xhc3NOYW1lOiAnX0pvYlN0YXR1cycsXG4gICAgZmllbGRzOiB7fSxcbiAgICBjbGFzc0xldmVsUGVybWlzc2lvbnM6IHt9LFxuICB9KVxuKTtcbmNvbnN0IF9Kb2JTY2hlZHVsZVNjaGVtYSA9IGNvbnZlcnRTY2hlbWFUb0FkYXB0ZXJTY2hlbWEoXG4gIGluamVjdERlZmF1bHRTY2hlbWEoe1xuICAgIGNsYXNzTmFtZTogJ19Kb2JTY2hlZHVsZScsXG4gICAgZmllbGRzOiB7fSxcbiAgICBjbGFzc0xldmVsUGVybWlzc2lvbnM6IHt9LFxuICB9KVxuKTtcbmNvbnN0IF9BdWRpZW5jZVNjaGVtYSA9IGNvbnZlcnRTY2hlbWFUb0FkYXB0ZXJTY2hlbWEoXG4gIGluamVjdERlZmF1bHRTY2hlbWEoe1xuICAgIGNsYXNzTmFtZTogJ19BdWRpZW5jZScsXG4gICAgZmllbGRzOiBkZWZhdWx0Q29sdW1ucy5fQXVkaWVuY2UsXG4gICAgY2xhc3NMZXZlbFBlcm1pc3Npb25zOiB7fSxcbiAgfSlcbik7XG5jb25zdCBfSWRlbXBvdGVuY3lTY2hlbWEgPSBjb252ZXJ0U2NoZW1hVG9BZGFwdGVyU2NoZW1hKFxuICBpbmplY3REZWZhdWx0U2NoZW1hKHtcbiAgICBjbGFzc05hbWU6ICdfSWRlbXBvdGVuY3knLFxuICAgIGZpZWxkczogZGVmYXVsdENvbHVtbnMuX0lkZW1wb3RlbmN5LFxuICAgIGNsYXNzTGV2ZWxQZXJtaXNzaW9uczoge30sXG4gIH0pXG4pO1xuY29uc3QgVm9sYXRpbGVDbGFzc2VzU2NoZW1hcyA9IFtcbiAgX0hvb2tzU2NoZW1hLFxuICBfSm9iU3RhdHVzU2NoZW1hLFxuICBfSm9iU2NoZWR1bGVTY2hlbWEsXG4gIF9QdXNoU3RhdHVzU2NoZW1hLFxuICBfR2xvYmFsQ29uZmlnU2NoZW1hLFxuICBfR3JhcGhRTENvbmZpZ1NjaGVtYSxcbiAgX0F1ZGllbmNlU2NoZW1hLFxuICBfSWRlbXBvdGVuY3lTY2hlbWEsXG5dO1xuXG5jb25zdCBkYlR5cGVNYXRjaGVzT2JqZWN0VHlwZSA9IChkYlR5cGU6IFNjaGVtYUZpZWxkIHwgc3RyaW5nLCBvYmplY3RUeXBlOiBTY2hlbWFGaWVsZCkgPT4ge1xuICBpZiAoZGJUeXBlLnR5cGUgIT09IG9iamVjdFR5cGUudHlwZSkgcmV0dXJuIGZhbHNlO1xuICBpZiAoZGJUeXBlLnRhcmdldENsYXNzICE9PSBvYmplY3RUeXBlLnRhcmdldENsYXNzKSByZXR1cm4gZmFsc2U7XG4gIGlmIChkYlR5cGUgPT09IG9iamVjdFR5cGUudHlwZSkgcmV0dXJuIHRydWU7XG4gIGlmIChkYlR5cGUudHlwZSA9PT0gb2JqZWN0VHlwZS50eXBlKSByZXR1cm4gdHJ1ZTtcbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuY29uc3QgdHlwZVRvU3RyaW5nID0gKHR5cGU6IFNjaGVtYUZpZWxkIHwgc3RyaW5nKTogc3RyaW5nID0+IHtcbiAgaWYgKHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiB0eXBlO1xuICB9XG4gIGlmICh0eXBlLnRhcmdldENsYXNzKSB7XG4gICAgcmV0dXJuIGAke3R5cGUudHlwZX08JHt0eXBlLnRhcmdldENsYXNzfT5gO1xuICB9XG4gIHJldHVybiBgJHt0eXBlLnR5cGV9YDtcbn07XG5cbi8vIFN0b3JlcyB0aGUgZW50aXJlIHNjaGVtYSBvZiB0aGUgYXBwIGluIGEgd2VpcmQgaHlicmlkIGZvcm1hdCBzb21ld2hlcmUgYmV0d2VlblxuLy8gdGhlIG1vbmdvIGZvcm1hdCBhbmQgdGhlIFBhcnNlIGZvcm1hdC4gU29vbiwgdGhpcyB3aWxsIGFsbCBiZSBQYXJzZSBmb3JtYXQuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTY2hlbWFDb250cm9sbGVyIHtcbiAgX2RiQWRhcHRlcjogU3RvcmFnZUFkYXB0ZXI7XG4gIHNjaGVtYURhdGE6IHsgW3N0cmluZ106IFNjaGVtYSB9O1xuICByZWxvYWREYXRhUHJvbWlzZTogP1Byb21pc2U8YW55PjtcbiAgcHJvdGVjdGVkRmllbGRzOiBhbnk7XG4gIHVzZXJJZFJlZ0V4OiBSZWdFeHA7XG5cbiAgY29uc3RydWN0b3IoZGF0YWJhc2VBZGFwdGVyOiBTdG9yYWdlQWRhcHRlcikge1xuICAgIHRoaXMuX2RiQWRhcHRlciA9IGRhdGFiYXNlQWRhcHRlcjtcbiAgICB0aGlzLnNjaGVtYURhdGEgPSBuZXcgU2NoZW1hRGF0YShTY2hlbWFDYWNoZS5hbGwoKSwgdGhpcy5wcm90ZWN0ZWRGaWVsZHMpO1xuICAgIHRoaXMucHJvdGVjdGVkRmllbGRzID0gQ29uZmlnLmdldChQYXJzZS5hcHBsaWNhdGlvbklkKS5wcm90ZWN0ZWRGaWVsZHM7XG5cbiAgICBjb25zdCBjdXN0b21JZHMgPSBDb25maWcuZ2V0KFBhcnNlLmFwcGxpY2F0aW9uSWQpLmFsbG93Q3VzdG9tT2JqZWN0SWQ7XG5cbiAgICBjb25zdCBjdXN0b21JZFJlZ0V4ID0gL14uezEsfSQvdTsgLy8gMSsgY2hhcnNcbiAgICBjb25zdCBhdXRvSWRSZWdFeCA9IC9eW2EtekEtWjAtOV17MSx9JC87XG5cbiAgICB0aGlzLnVzZXJJZFJlZ0V4ID0gY3VzdG9tSWRzID8gY3VzdG9tSWRSZWdFeCA6IGF1dG9JZFJlZ0V4O1xuXG4gICAgdGhpcy5fZGJBZGFwdGVyLndhdGNoKCgpID0+IHtcbiAgICAgIHRoaXMucmVsb2FkRGF0YSh7IGNsZWFyQ2FjaGU6IHRydWUgfSk7XG4gICAgfSk7XG4gIH1cblxuICByZWxvYWREYXRhKG9wdGlvbnM6IExvYWRTY2hlbWFPcHRpb25zID0geyBjbGVhckNhY2hlOiBmYWxzZSB9KTogUHJvbWlzZTxhbnk+IHtcbiAgICBpZiAodGhpcy5yZWxvYWREYXRhUHJvbWlzZSAmJiAhb3B0aW9ucy5jbGVhckNhY2hlKSB7XG4gICAgICByZXR1cm4gdGhpcy5yZWxvYWREYXRhUHJvbWlzZTtcbiAgICB9XG4gICAgdGhpcy5yZWxvYWREYXRhUHJvbWlzZSA9IHRoaXMuZ2V0QWxsQ2xhc3NlcyhvcHRpb25zKVxuICAgICAgLnRoZW4oXG4gICAgICAgIGFsbFNjaGVtYXMgPT4ge1xuICAgICAgICAgIHRoaXMuc2NoZW1hRGF0YSA9IG5ldyBTY2hlbWFEYXRhKGFsbFNjaGVtYXMsIHRoaXMucHJvdGVjdGVkRmllbGRzKTtcbiAgICAgICAgICBkZWxldGUgdGhpcy5yZWxvYWREYXRhUHJvbWlzZTtcbiAgICAgICAgfSxcbiAgICAgICAgZXJyID0+IHtcbiAgICAgICAgICB0aGlzLnNjaGVtYURhdGEgPSBuZXcgU2NoZW1hRGF0YSgpO1xuICAgICAgICAgIGRlbGV0ZSB0aGlzLnJlbG9hZERhdGFQcm9taXNlO1xuICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuICAgICAgKVxuICAgICAgLnRoZW4oKCkgPT4ge30pO1xuICAgIHJldHVybiB0aGlzLnJlbG9hZERhdGFQcm9taXNlO1xuICB9XG5cbiAgZ2V0QWxsQ2xhc3NlcyhvcHRpb25zOiBMb2FkU2NoZW1hT3B0aW9ucyA9IHsgY2xlYXJDYWNoZTogZmFsc2UgfSk6IFByb21pc2U8QXJyYXk8U2NoZW1hPj4ge1xuICAgIGlmIChvcHRpb25zLmNsZWFyQ2FjaGUpIHtcbiAgICAgIHJldHVybiB0aGlzLnNldEFsbENsYXNzZXMoKTtcbiAgICB9XG4gICAgY29uc3QgY2FjaGVkID0gU2NoZW1hQ2FjaGUuYWxsKCk7XG4gICAgaWYgKGNhY2hlZCAmJiBjYWNoZWQubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNhY2hlZCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnNldEFsbENsYXNzZXMoKTtcbiAgfVxuXG4gIHNldEFsbENsYXNzZXMoKTogUHJvbWlzZTxBcnJheTxTY2hlbWE+PiB7XG4gICAgcmV0dXJuIHRoaXMuX2RiQWRhcHRlclxuICAgICAgLmdldEFsbENsYXNzZXMoKVxuICAgICAgLnRoZW4oYWxsU2NoZW1hcyA9PiBhbGxTY2hlbWFzLm1hcChpbmplY3REZWZhdWx0U2NoZW1hKSlcbiAgICAgIC50aGVuKGFsbFNjaGVtYXMgPT4ge1xuICAgICAgICBTY2hlbWFDYWNoZS5wdXQoYWxsU2NoZW1hcyk7XG4gICAgICAgIHJldHVybiBhbGxTY2hlbWFzO1xuICAgICAgfSk7XG4gIH1cblxuICBnZXRPbmVTY2hlbWEoXG4gICAgY2xhc3NOYW1lOiBzdHJpbmcsXG4gICAgYWxsb3dWb2xhdGlsZUNsYXNzZXM6IGJvb2xlYW4gPSBmYWxzZSxcbiAgICBvcHRpb25zOiBMb2FkU2NoZW1hT3B0aW9ucyA9IHsgY2xlYXJDYWNoZTogZmFsc2UgfVxuICApOiBQcm9taXNlPFNjaGVtYT4ge1xuICAgIGlmIChvcHRpb25zLmNsZWFyQ2FjaGUpIHtcbiAgICAgIFNjaGVtYUNhY2hlLmNsZWFyKCk7XG4gICAgfVxuICAgIGlmIChhbGxvd1ZvbGF0aWxlQ2xhc3NlcyAmJiB2b2xhdGlsZUNsYXNzZXMuaW5kZXhPZihjbGFzc05hbWUpID4gLTEpIHtcbiAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLnNjaGVtYURhdGFbY2xhc3NOYW1lXTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuICAgICAgICBjbGFzc05hbWUsXG4gICAgICAgIGZpZWxkczogZGF0YS5maWVsZHMsXG4gICAgICAgIGNsYXNzTGV2ZWxQZXJtaXNzaW9uczogZGF0YS5jbGFzc0xldmVsUGVybWlzc2lvbnMsXG4gICAgICAgIGluZGV4ZXM6IGRhdGEuaW5kZXhlcyxcbiAgICAgIH0pO1xuICAgIH1cbiAgICBjb25zdCBjYWNoZWQgPSBTY2hlbWFDYWNoZS5nZXQoY2xhc3NOYW1lKTtcbiAgICBpZiAoY2FjaGVkICYmICFvcHRpb25zLmNsZWFyQ2FjaGUpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY2FjaGVkKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuc2V0QWxsQ2xhc3NlcygpLnRoZW4oYWxsU2NoZW1hcyA9PiB7XG4gICAgICBjb25zdCBvbmVTY2hlbWEgPSBhbGxTY2hlbWFzLmZpbmQoc2NoZW1hID0+IHNjaGVtYS5jbGFzc05hbWUgPT09IGNsYXNzTmFtZSk7XG4gICAgICBpZiAoIW9uZVNjaGVtYSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QodW5kZWZpbmVkKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBvbmVTY2hlbWE7XG4gICAgfSk7XG4gIH1cblxuICAvLyBDcmVhdGUgYSBuZXcgY2xhc3MgdGhhdCBpbmNsdWRlcyB0aGUgdGhyZWUgZGVmYXVsdCBmaWVsZHMuXG4gIC8vIEFDTCBpcyBhbiBpbXBsaWNpdCBjb2x1bW4gdGhhdCBkb2VzIG5vdCBnZXQgYW4gZW50cnkgaW4gdGhlXG4gIC8vIF9TQ0hFTUFTIGRhdGFiYXNlLiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdpdGggdGhlXG4gIC8vIGNyZWF0ZWQgc2NoZW1hLCBpbiBtb25nbyBmb3JtYXQuXG4gIC8vIG9uIHN1Y2Nlc3MsIGFuZCByZWplY3RzIHdpdGggYW4gZXJyb3Igb24gZmFpbC4gRW5zdXJlIHlvdVxuICAvLyBoYXZlIGF1dGhvcml6YXRpb24gKG1hc3RlciBrZXksIG9yIGNsaWVudCBjbGFzcyBjcmVhdGlvblxuICAvLyBlbmFibGVkKSBiZWZvcmUgY2FsbGluZyB0aGlzIGZ1bmN0aW9uLlxuICBhc3luYyBhZGRDbGFzc0lmTm90RXhpc3RzKFxuICAgIGNsYXNzTmFtZTogc3RyaW5nLFxuICAgIGZpZWxkczogU2NoZW1hRmllbGRzID0ge30sXG4gICAgY2xhc3NMZXZlbFBlcm1pc3Npb25zOiBhbnksXG4gICAgaW5kZXhlczogYW55ID0ge31cbiAgKTogUHJvbWlzZTx2b2lkIHwgU2NoZW1hPiB7XG4gICAgdmFyIHZhbGlkYXRpb25FcnJvciA9IHRoaXMudmFsaWRhdGVOZXdDbGFzcyhjbGFzc05hbWUsIGZpZWxkcywgY2xhc3NMZXZlbFBlcm1pc3Npb25zKTtcbiAgICBpZiAodmFsaWRhdGlvbkVycm9yKSB7XG4gICAgICBpZiAodmFsaWRhdGlvbkVycm9yIGluc3RhbmNlb2YgUGFyc2UuRXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KHZhbGlkYXRpb25FcnJvcik7XG4gICAgICB9IGVsc2UgaWYgKHZhbGlkYXRpb25FcnJvci5jb2RlICYmIHZhbGlkYXRpb25FcnJvci5lcnJvcikge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IFBhcnNlLkVycm9yKHZhbGlkYXRpb25FcnJvci5jb2RlLCB2YWxpZGF0aW9uRXJyb3IuZXJyb3IpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCh2YWxpZGF0aW9uRXJyb3IpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgY29uc3QgYWRhcHRlclNjaGVtYSA9IGF3YWl0IHRoaXMuX2RiQWRhcHRlci5jcmVhdGVDbGFzcyhcbiAgICAgICAgY2xhc3NOYW1lLFxuICAgICAgICBjb252ZXJ0U2NoZW1hVG9BZGFwdGVyU2NoZW1hKHtcbiAgICAgICAgICBmaWVsZHMsXG4gICAgICAgICAgY2xhc3NMZXZlbFBlcm1pc3Npb25zLFxuICAgICAgICAgIGluZGV4ZXMsXG4gICAgICAgICAgY2xhc3NOYW1lLFxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICAgIC8vIFRPRE86IFJlbW92ZSBieSB1cGRhdGluZyBzY2hlbWEgY2FjaGUgZGlyZWN0bHlcbiAgICAgIGF3YWl0IHRoaXMucmVsb2FkRGF0YSh7IGNsZWFyQ2FjaGU6IHRydWUgfSk7XG4gICAgICBjb25zdCBwYXJzZVNjaGVtYSA9IGNvbnZlcnRBZGFwdGVyU2NoZW1hVG9QYXJzZVNjaGVtYShhZGFwdGVyU2NoZW1hKTtcbiAgICAgIHJldHVybiBwYXJzZVNjaGVtYTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKGVycm9yICYmIGVycm9yLmNvZGUgPT09IFBhcnNlLkVycm9yLkRVUExJQ0FURV9WQUxVRSkge1xuICAgICAgICB0aHJvdyBuZXcgUGFyc2UuRXJyb3IoUGFyc2UuRXJyb3IuSU5WQUxJRF9DTEFTU19OQU1FLCBgQ2xhc3MgJHtjbGFzc05hbWV9IGFscmVhZHkgZXhpc3RzLmApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgdXBkYXRlQ2xhc3MoXG4gICAgY2xhc3NOYW1lOiBzdHJpbmcsXG4gICAgc3VibWl0dGVkRmllbGRzOiBTY2hlbWFGaWVsZHMsXG4gICAgY2xhc3NMZXZlbFBlcm1pc3Npb25zOiBhbnksXG4gICAgaW5kZXhlczogYW55LFxuICAgIGRhdGFiYXNlOiBEYXRhYmFzZUNvbnRyb2xsZXJcbiAgKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0T25lU2NoZW1hKGNsYXNzTmFtZSlcbiAgICAgIC50aGVuKHNjaGVtYSA9PiB7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nRmllbGRzID0gc2NoZW1hLmZpZWxkcztcbiAgICAgICAgT2JqZWN0LmtleXMoc3VibWl0dGVkRmllbGRzKS5mb3JFYWNoKG5hbWUgPT4ge1xuICAgICAgICAgIGNvbnN0IGZpZWxkID0gc3VibWl0dGVkRmllbGRzW25hbWVdO1xuICAgICAgICAgIGlmIChleGlzdGluZ0ZpZWxkc1tuYW1lXSAmJiBmaWVsZC5fX29wICE9PSAnRGVsZXRlJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFBhcnNlLkVycm9yKDI1NSwgYEZpZWxkICR7bmFtZX0gZXhpc3RzLCBjYW5ub3QgdXBkYXRlLmApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIWV4aXN0aW5nRmllbGRzW25hbWVdICYmIGZpZWxkLl9fb3AgPT09ICdEZWxldGUnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgUGFyc2UuRXJyb3IoMjU1LCBgRmllbGQgJHtuYW1lfSBkb2VzIG5vdCBleGlzdCwgY2Fubm90IGRlbGV0ZS5gKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGRlbGV0ZSBleGlzdGluZ0ZpZWxkcy5fcnBlcm07XG4gICAgICAgIGRlbGV0ZSBleGlzdGluZ0ZpZWxkcy5fd3Blcm07XG4gICAgICAgIGNvbnN0IG5ld1NjaGVtYSA9IGJ1aWxkTWVyZ2VkU2NoZW1hT2JqZWN0KGV4aXN0aW5nRmllbGRzLCBzdWJtaXR0ZWRGaWVsZHMpO1xuICAgICAgICBjb25zdCBkZWZhdWx0RmllbGRzID0gZGVmYXVsdENvbHVtbnNbY2xhc3NOYW1lXSB8fCBkZWZhdWx0Q29sdW1ucy5fRGVmYXVsdDtcbiAgICAgICAgY29uc3QgZnVsbE5ld1NjaGVtYSA9IE9iamVjdC5hc3NpZ24oe30sIG5ld1NjaGVtYSwgZGVmYXVsdEZpZWxkcyk7XG4gICAgICAgIGNvbnN0IHZhbGlkYXRpb25FcnJvciA9IHRoaXMudmFsaWRhdGVTY2hlbWFEYXRhKFxuICAgICAgICAgIGNsYXNzTmFtZSxcbiAgICAgICAgICBuZXdTY2hlbWEsXG4gICAgICAgICAgY2xhc3NMZXZlbFBlcm1pc3Npb25zLFxuICAgICAgICAgIE9iamVjdC5rZXlzKGV4aXN0aW5nRmllbGRzKVxuICAgICAgICApO1xuICAgICAgICBpZiAodmFsaWRhdGlvbkVycm9yKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFBhcnNlLkVycm9yKHZhbGlkYXRpb25FcnJvci5jb2RlLCB2YWxpZGF0aW9uRXJyb3IuZXJyb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRmluYWxseSB3ZSBoYXZlIGNoZWNrZWQgdG8gbWFrZSBzdXJlIHRoZSByZXF1ZXN0IGlzIHZhbGlkIGFuZCB3ZSBjYW4gc3RhcnQgZGVsZXRpbmcgZmllbGRzLlxuICAgICAgICAvLyBEbyBhbGwgZGVsZXRpb25zIGZpcnN0LCB0aGVuIGEgc2luZ2xlIHNhdmUgdG8gX1NDSEVNQSBjb2xsZWN0aW9uIHRvIGhhbmRsZSBhbGwgYWRkaXRpb25zLlxuICAgICAgICBjb25zdCBkZWxldGVkRmllbGRzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBjb25zdCBpbnNlcnRlZEZpZWxkcyA9IFtdO1xuICAgICAgICBPYmplY3Qua2V5cyhzdWJtaXR0ZWRGaWVsZHMpLmZvckVhY2goZmllbGROYW1lID0+IHtcbiAgICAgICAgICBpZiAoc3VibWl0dGVkRmllbGRzW2ZpZWxkTmFtZV0uX19vcCA9PT0gJ0RlbGV0ZScpIHtcbiAgICAgICAgICAgIGRlbGV0ZWRGaWVsZHMucHVzaChmaWVsZE5hbWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpbnNlcnRlZEZpZWxkcy5wdXNoKGZpZWxkTmFtZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBsZXQgZGVsZXRlUHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICBpZiAoZGVsZXRlZEZpZWxkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgZGVsZXRlUHJvbWlzZSA9IHRoaXMuZGVsZXRlRmllbGRzKGRlbGV0ZWRGaWVsZHMsIGNsYXNzTmFtZSwgZGF0YWJhc2UpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBlbmZvcmNlRmllbGRzID0gW107XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgZGVsZXRlUHJvbWlzZSAvLyBEZWxldGUgRXZlcnl0aGluZ1xuICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5yZWxvYWREYXRhKHsgY2xlYXJDYWNoZTogdHJ1ZSB9KSkgLy8gUmVsb2FkIG91ciBTY2hlbWEsIHNvIHdlIGhhdmUgYWxsIHRoZSBuZXcgdmFsdWVzXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IHByb21pc2VzID0gaW5zZXJ0ZWRGaWVsZHMubWFwKGZpZWxkTmFtZSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgdHlwZSA9IHN1Ym1pdHRlZEZpZWxkc1tmaWVsZE5hbWVdO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmVuZm9yY2VGaWVsZEV4aXN0cyhjbGFzc05hbWUsIGZpZWxkTmFtZSwgdHlwZSk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3VsdHMgPT4ge1xuICAgICAgICAgICAgICBlbmZvcmNlRmllbGRzID0gcmVzdWx0cy5maWx0ZXIocmVzdWx0ID0+ICEhcmVzdWx0KTtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2V0UGVybWlzc2lvbnMoY2xhc3NOYW1lLCBjbGFzc0xldmVsUGVybWlzc2lvbnMsIG5ld1NjaGVtYSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oKCkgPT5cbiAgICAgICAgICAgICAgdGhpcy5fZGJBZGFwdGVyLnNldEluZGV4ZXNXaXRoU2NoZW1hRm9ybWF0KFxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZSxcbiAgICAgICAgICAgICAgICBpbmRleGVzLFxuICAgICAgICAgICAgICAgIHNjaGVtYS5pbmRleGVzLFxuICAgICAgICAgICAgICAgIGZ1bGxOZXdTY2hlbWFcbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5yZWxvYWREYXRhKHsgY2xlYXJDYWNoZTogdHJ1ZSB9KSlcbiAgICAgICAgICAgIC8vVE9ETzogTW92ZSB0aGlzIGxvZ2ljIGludG8gdGhlIGRhdGFiYXNlIGFkYXB0ZXJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5lbnN1cmVGaWVsZHMoZW5mb3JjZUZpZWxkcyk7XG4gICAgICAgICAgICAgIGNvbnN0IHNjaGVtYSA9IHRoaXMuc2NoZW1hRGF0YVtjbGFzc05hbWVdO1xuICAgICAgICAgICAgICBjb25zdCByZWxvYWRlZFNjaGVtYTogU2NoZW1hID0ge1xuICAgICAgICAgICAgICAgIGNsYXNzTmFtZTogY2xhc3NOYW1lLFxuICAgICAgICAgICAgICAgIGZpZWxkczogc2NoZW1hLmZpZWxkcyxcbiAgICAgICAgICAgICAgICBjbGFzc0xldmVsUGVybWlzc2lvbnM6IHNjaGVtYS5jbGFzc0xldmVsUGVybWlzc2lvbnMsXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIGlmIChzY2hlbWEuaW5kZXhlcyAmJiBPYmplY3Qua2V5cyhzY2hlbWEuaW5kZXhlcykubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgcmVsb2FkZWRTY2hlbWEuaW5kZXhlcyA9IHNjaGVtYS5pbmRleGVzO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiByZWxvYWRlZFNjaGVtYTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgaWYgKGVycm9yID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgUGFyc2UuRXJyb3IoXG4gICAgICAgICAgICBQYXJzZS5FcnJvci5JTlZBTElEX0NMQVNTX05BTUUsXG4gICAgICAgICAgICBgQ2xhc3MgJHtjbGFzc05hbWV9IGRvZXMgbm90IGV4aXN0LmBcbiAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIC8vIFJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgc3VjY2Vzc2Z1bGx5IHRvIHRoZSBuZXcgc2NoZW1hXG4gIC8vIG9iamVjdCBvciBmYWlscyB3aXRoIGEgcmVhc29uLlxuICBlbmZvcmNlQ2xhc3NFeGlzdHMoY2xhc3NOYW1lOiBzdHJpbmcpOiBQcm9taXNlPFNjaGVtYUNvbnRyb2xsZXI+IHtcbiAgICBpZiAodGhpcy5zY2hlbWFEYXRhW2NsYXNzTmFtZV0pIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcyk7XG4gICAgfVxuICAgIC8vIFdlIGRvbid0IGhhdmUgdGhpcyBjbGFzcy4gVXBkYXRlIHRoZSBzY2hlbWFcbiAgICByZXR1cm4gKFxuICAgICAgLy8gVGhlIHNjaGVtYSB1cGRhdGUgc3VjY2VlZGVkLiBSZWxvYWQgdGhlIHNjaGVtYVxuICAgICAgdGhpcy5hZGRDbGFzc0lmTm90RXhpc3RzKGNsYXNzTmFtZSlcbiAgICAgICAgLmNhdGNoKCgpID0+IHtcbiAgICAgICAgICAvLyBUaGUgc2NoZW1hIHVwZGF0ZSBmYWlsZWQuIFRoaXMgY2FuIGJlIG9rYXkgLSBpdCBtaWdodFxuICAgICAgICAgIC8vIGhhdmUgZmFpbGVkIGJlY2F1c2UgdGhlcmUncyBhIHJhY2UgY29uZGl0aW9uIGFuZCBhIGRpZmZlcmVudFxuICAgICAgICAgIC8vIGNsaWVudCBpcyBtYWtpbmcgdGhlIGV4YWN0IHNhbWUgc2NoZW1hIHVwZGF0ZSB0aGF0IHdlIHdhbnQuXG4gICAgICAgICAgLy8gU28ganVzdCByZWxvYWQgdGhlIHNjaGVtYS5cbiAgICAgICAgICByZXR1cm4gdGhpcy5yZWxvYWREYXRhKHsgY2xlYXJDYWNoZTogdHJ1ZSB9KTtcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIC8vIEVuc3VyZSB0aGF0IHRoZSBzY2hlbWEgbm93IHZhbGlkYXRlc1xuICAgICAgICAgIGlmICh0aGlzLnNjaGVtYURhdGFbY2xhc3NOYW1lXSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBQYXJzZS5FcnJvcihQYXJzZS5FcnJvci5JTlZBTElEX0pTT04sIGBGYWlsZWQgdG8gYWRkICR7Y2xhc3NOYW1lfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKCgpID0+IHtcbiAgICAgICAgICAvLyBUaGUgc2NoZW1hIHN0aWxsIGRvZXNuJ3QgdmFsaWRhdGUuIEdpdmUgdXBcbiAgICAgICAgICB0aHJvdyBuZXcgUGFyc2UuRXJyb3IoUGFyc2UuRXJyb3IuSU5WQUxJRF9KU09OLCAnc2NoZW1hIGNsYXNzIG5hbWUgZG9lcyBub3QgcmV2YWxpZGF0ZScpO1xuICAgICAgICB9KVxuICAgICk7XG4gIH1cblxuICB2YWxpZGF0ZU5ld0NsYXNzKGNsYXNzTmFtZTogc3RyaW5nLCBmaWVsZHM6IFNjaGVtYUZpZWxkcyA9IHt9LCBjbGFzc0xldmVsUGVybWlzc2lvbnM6IGFueSk6IGFueSB7XG4gICAgaWYgKHRoaXMuc2NoZW1hRGF0YVtjbGFzc05hbWVdKSB7XG4gICAgICB0aHJvdyBuZXcgUGFyc2UuRXJyb3IoUGFyc2UuRXJyb3IuSU5WQUxJRF9DTEFTU19OQU1FLCBgQ2xhc3MgJHtjbGFzc05hbWV9IGFscmVhZHkgZXhpc3RzLmApO1xuICAgIH1cbiAgICBpZiAoIWNsYXNzTmFtZUlzVmFsaWQoY2xhc3NOYW1lKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29kZTogUGFyc2UuRXJyb3IuSU5WQUxJRF9DTEFTU19OQU1FLFxuICAgICAgICBlcnJvcjogaW52YWxpZENsYXNzTmFtZU1lc3NhZ2UoY2xhc3NOYW1lKSxcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnZhbGlkYXRlU2NoZW1hRGF0YShjbGFzc05hbWUsIGZpZWxkcywgY2xhc3NMZXZlbFBlcm1pc3Npb25zLCBbXSk7XG4gIH1cblxuICB2YWxpZGF0ZVNjaGVtYURhdGEoXG4gICAgY2xhc3NOYW1lOiBzdHJpbmcsXG4gICAgZmllbGRzOiBTY2hlbWFGaWVsZHMsXG4gICAgY2xhc3NMZXZlbFBlcm1pc3Npb25zOiBDbGFzc0xldmVsUGVybWlzc2lvbnMsXG4gICAgZXhpc3RpbmdGaWVsZE5hbWVzOiBBcnJheTxzdHJpbmc+XG4gICkge1xuICAgIGZvciAoY29uc3QgZmllbGROYW1lIGluIGZpZWxkcykge1xuICAgICAgaWYgKGV4aXN0aW5nRmllbGROYW1lcy5pbmRleE9mKGZpZWxkTmFtZSkgPCAwKSB7XG4gICAgICAgIGlmICghZmllbGROYW1lSXNWYWxpZChmaWVsZE5hbWUsIGNsYXNzTmFtZSkpIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY29kZTogUGFyc2UuRXJyb3IuSU5WQUxJRF9LRVlfTkFNRSxcbiAgICAgICAgICAgIGVycm9yOiAnaW52YWxpZCBmaWVsZCBuYW1lOiAnICsgZmllbGROYW1lLFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFmaWVsZE5hbWVJc1ZhbGlkRm9yQ2xhc3MoZmllbGROYW1lLCBjbGFzc05hbWUpKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvZGU6IDEzNixcbiAgICAgICAgICAgIGVycm9yOiAnZmllbGQgJyArIGZpZWxkTmFtZSArICcgY2Fubm90IGJlIGFkZGVkJyxcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGZpZWxkVHlwZSA9IGZpZWxkc1tmaWVsZE5hbWVdO1xuICAgICAgICBjb25zdCBlcnJvciA9IGZpZWxkVHlwZUlzSW52YWxpZChmaWVsZFR5cGUpO1xuICAgICAgICBpZiAoZXJyb3IpIHJldHVybiB7IGNvZGU6IGVycm9yLmNvZGUsIGVycm9yOiBlcnJvci5tZXNzYWdlIH07XG4gICAgICAgIGlmIChmaWVsZFR5cGUuZGVmYXVsdFZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBsZXQgZGVmYXVsdFZhbHVlVHlwZSA9IGdldFR5cGUoZmllbGRUeXBlLmRlZmF1bHRWYWx1ZSk7XG4gICAgICAgICAgaWYgKHR5cGVvZiBkZWZhdWx0VmFsdWVUeXBlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlVHlwZSA9IHsgdHlwZTogZGVmYXVsdFZhbHVlVHlwZSB9O1xuICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGRlZmF1bHRWYWx1ZVR5cGUgPT09ICdvYmplY3QnICYmIGZpZWxkVHlwZS50eXBlID09PSAnUmVsYXRpb24nKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBjb2RlOiBQYXJzZS5FcnJvci5JTkNPUlJFQ1RfVFlQRSxcbiAgICAgICAgICAgICAgZXJyb3I6IGBUaGUgJ2RlZmF1bHQgdmFsdWUnIG9wdGlvbiBpcyBub3QgYXBwbGljYWJsZSBmb3IgJHt0eXBlVG9TdHJpbmcoZmllbGRUeXBlKX1gLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFkYlR5cGVNYXRjaGVzT2JqZWN0VHlwZShmaWVsZFR5cGUsIGRlZmF1bHRWYWx1ZVR5cGUpKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBjb2RlOiBQYXJzZS5FcnJvci5JTkNPUlJFQ1RfVFlQRSxcbiAgICAgICAgICAgICAgZXJyb3I6IGBzY2hlbWEgbWlzbWF0Y2ggZm9yICR7Y2xhc3NOYW1lfS4ke2ZpZWxkTmFtZX0gZGVmYXVsdCB2YWx1ZTsgZXhwZWN0ZWQgJHt0eXBlVG9TdHJpbmcoXG4gICAgICAgICAgICAgICAgZmllbGRUeXBlXG4gICAgICAgICAgICAgICl9IGJ1dCBnb3QgJHt0eXBlVG9TdHJpbmcoZGVmYXVsdFZhbHVlVHlwZSl9YCxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGZpZWxkVHlwZS5yZXF1aXJlZCkge1xuICAgICAgICAgIGlmICh0eXBlb2YgZmllbGRUeXBlID09PSAnb2JqZWN0JyAmJiBmaWVsZFR5cGUudHlwZSA9PT0gJ1JlbGF0aW9uJykge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgY29kZTogUGFyc2UuRXJyb3IuSU5DT1JSRUNUX1RZUEUsXG4gICAgICAgICAgICAgIGVycm9yOiBgVGhlICdyZXF1aXJlZCcgb3B0aW9uIGlzIG5vdCBhcHBsaWNhYmxlIGZvciAke3R5cGVUb1N0cmluZyhmaWVsZFR5cGUpfWAsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoY29uc3QgZmllbGROYW1lIGluIGRlZmF1bHRDb2x1bW5zW2NsYXNzTmFtZV0pIHtcbiAgICAgIGZpZWxkc1tmaWVsZE5hbWVdID0gZGVmYXVsdENvbHVtbnNbY2xhc3NOYW1lXVtmaWVsZE5hbWVdO1xuICAgIH1cblxuICAgIGNvbnN0IGdlb1BvaW50cyA9IE9iamVjdC5rZXlzKGZpZWxkcykuZmlsdGVyKFxuICAgICAga2V5ID0+IGZpZWxkc1trZXldICYmIGZpZWxkc1trZXldLnR5cGUgPT09ICdHZW9Qb2ludCdcbiAgICApO1xuICAgIGlmIChnZW9Qb2ludHMubGVuZ3RoID4gMSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29kZTogUGFyc2UuRXJyb3IuSU5DT1JSRUNUX1RZUEUsXG4gICAgICAgIGVycm9yOlxuICAgICAgICAgICdjdXJyZW50bHksIG9ubHkgb25lIEdlb1BvaW50IGZpZWxkIG1heSBleGlzdCBpbiBhbiBvYmplY3QuIEFkZGluZyAnICtcbiAgICAgICAgICBnZW9Qb2ludHNbMV0gK1xuICAgICAgICAgICcgd2hlbiAnICtcbiAgICAgICAgICBnZW9Qb2ludHNbMF0gK1xuICAgICAgICAgICcgYWxyZWFkeSBleGlzdHMuJyxcbiAgICAgIH07XG4gICAgfVxuICAgIHZhbGlkYXRlQ0xQKGNsYXNzTGV2ZWxQZXJtaXNzaW9ucywgZmllbGRzLCB0aGlzLnVzZXJJZFJlZ0V4KTtcbiAgfVxuXG4gIC8vIFNldHMgdGhlIENsYXNzLWxldmVsIHBlcm1pc3Npb25zIGZvciBhIGdpdmVuIGNsYXNzTmFtZSwgd2hpY2ggbXVzdCBleGlzdC5cbiAgYXN5bmMgc2V0UGVybWlzc2lvbnMoY2xhc3NOYW1lOiBzdHJpbmcsIHBlcm1zOiBhbnksIG5ld1NjaGVtYTogU2NoZW1hRmllbGRzKSB7XG4gICAgaWYgKHR5cGVvZiBwZXJtcyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG4gICAgdmFsaWRhdGVDTFAocGVybXMsIG5ld1NjaGVtYSwgdGhpcy51c2VySWRSZWdFeCk7XG4gICAgYXdhaXQgdGhpcy5fZGJBZGFwdGVyLnNldENsYXNzTGV2ZWxQZXJtaXNzaW9ucyhjbGFzc05hbWUsIHBlcm1zKTtcbiAgICBjb25zdCBjYWNoZWQgPSBTY2hlbWFDYWNoZS5nZXQoY2xhc3NOYW1lKTtcbiAgICBpZiAoY2FjaGVkKSB7XG4gICAgICBjYWNoZWQuY2xhc3NMZXZlbFBlcm1pc3Npb25zID0gcGVybXM7XG4gICAgfVxuICB9XG5cbiAgLy8gUmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyBzdWNjZXNzZnVsbHkgdG8gdGhlIG5ldyBzY2hlbWFcbiAgLy8gb2JqZWN0IGlmIHRoZSBwcm92aWRlZCBjbGFzc05hbWUtZmllbGROYW1lLXR5cGUgdHVwbGUgaXMgdmFsaWQuXG4gIC8vIFRoZSBjbGFzc05hbWUgbXVzdCBhbHJlYWR5IGJlIHZhbGlkYXRlZC5cbiAgLy8gSWYgJ2ZyZWV6ZScgaXMgdHJ1ZSwgcmVmdXNlIHRvIHVwZGF0ZSB0aGUgc2NoZW1hIGZvciB0aGlzIGZpZWxkLlxuICBlbmZvcmNlRmllbGRFeGlzdHMoY2xhc3NOYW1lOiBzdHJpbmcsIGZpZWxkTmFtZTogc3RyaW5nLCB0eXBlOiBzdHJpbmcgfCBTY2hlbWFGaWVsZCkge1xuICAgIGlmIChmaWVsZE5hbWUuaW5kZXhPZignLicpID4gMCkge1xuICAgICAgLy8gc3ViZG9jdW1lbnQga2V5ICh4LnkpID0+IG9rIGlmIHggaXMgb2YgdHlwZSAnb2JqZWN0J1xuICAgICAgZmllbGROYW1lID0gZmllbGROYW1lLnNwbGl0KCcuJylbMF07XG4gICAgICB0eXBlID0gJ09iamVjdCc7XG4gICAgfVxuICAgIGlmICghZmllbGROYW1lSXNWYWxpZChmaWVsZE5hbWUsIGNsYXNzTmFtZSkpIHtcbiAgICAgIHRocm93IG5ldyBQYXJzZS5FcnJvcihQYXJzZS5FcnJvci5JTlZBTElEX0tFWV9OQU1FLCBgSW52YWxpZCBmaWVsZCBuYW1lOiAke2ZpZWxkTmFtZX0uYCk7XG4gICAgfVxuXG4gICAgLy8gSWYgc29tZW9uZSB0cmllcyB0byBjcmVhdGUgYSBuZXcgZmllbGQgd2l0aCBudWxsL3VuZGVmaW5lZCBhcyB0aGUgdmFsdWUsIHJldHVybjtcbiAgICBpZiAoIXR5cGUpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgY29uc3QgZXhwZWN0ZWRUeXBlID0gdGhpcy5nZXRFeHBlY3RlZFR5cGUoY2xhc3NOYW1lLCBmaWVsZE5hbWUpO1xuICAgIGlmICh0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHR5cGUgPSAoeyB0eXBlIH06IFNjaGVtYUZpZWxkKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZS5kZWZhdWx0VmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbGV0IGRlZmF1bHRWYWx1ZVR5cGUgPSBnZXRUeXBlKHR5cGUuZGVmYXVsdFZhbHVlKTtcbiAgICAgIGlmICh0eXBlb2YgZGVmYXVsdFZhbHVlVHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgZGVmYXVsdFZhbHVlVHlwZSA9IHsgdHlwZTogZGVmYXVsdFZhbHVlVHlwZSB9O1xuICAgICAgfVxuICAgICAgaWYgKCFkYlR5cGVNYXRjaGVzT2JqZWN0VHlwZSh0eXBlLCBkZWZhdWx0VmFsdWVUeXBlKSkge1xuICAgICAgICB0aHJvdyBuZXcgUGFyc2UuRXJyb3IoXG4gICAgICAgICAgUGFyc2UuRXJyb3IuSU5DT1JSRUNUX1RZUEUsXG4gICAgICAgICAgYHNjaGVtYSBtaXNtYXRjaCBmb3IgJHtjbGFzc05hbWV9LiR7ZmllbGROYW1lfSBkZWZhdWx0IHZhbHVlOyBleHBlY3RlZCAke3R5cGVUb1N0cmluZyhcbiAgICAgICAgICAgIHR5cGVcbiAgICAgICAgICApfSBidXQgZ290ICR7dHlwZVRvU3RyaW5nKGRlZmF1bHRWYWx1ZVR5cGUpfWBcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZXhwZWN0ZWRUeXBlKSB7XG4gICAgICBpZiAoIWRiVHlwZU1hdGNoZXNPYmplY3RUeXBlKGV4cGVjdGVkVHlwZSwgdHlwZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFBhcnNlLkVycm9yKFxuICAgICAgICAgIFBhcnNlLkVycm9yLklOQ09SUkVDVF9UWVBFLFxuICAgICAgICAgIGBzY2hlbWEgbWlzbWF0Y2ggZm9yICR7Y2xhc3NOYW1lfS4ke2ZpZWxkTmFtZX07IGV4cGVjdGVkICR7dHlwZVRvU3RyaW5nKFxuICAgICAgICAgICAgZXhwZWN0ZWRUeXBlXG4gICAgICAgICAgKX0gYnV0IGdvdCAke3R5cGVUb1N0cmluZyh0eXBlKX1gXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9kYkFkYXB0ZXJcbiAgICAgIC5hZGRGaWVsZElmTm90RXhpc3RzKGNsYXNzTmFtZSwgZmllbGROYW1lLCB0eXBlKVxuICAgICAgLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgaWYgKGVycm9yLmNvZGUgPT0gUGFyc2UuRXJyb3IuSU5DT1JSRUNUX1RZUEUpIHtcbiAgICAgICAgICAvLyBNYWtlIHN1cmUgdGhhdCB3ZSB0aHJvdyBlcnJvcnMgd2hlbiBpdCBpcyBhcHByb3ByaWF0ZSB0byBkbyBzby5cbiAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgICAgICAvLyBUaGUgdXBkYXRlIGZhaWxlZC4gVGhpcyBjYW4gYmUgb2theSAtIGl0IG1pZ2h0IGhhdmUgYmVlbiBhIHJhY2VcbiAgICAgICAgLy8gY29uZGl0aW9uIHdoZXJlIGFub3RoZXIgY2xpZW50IHVwZGF0ZWQgdGhlIHNjaGVtYSBpbiB0aGUgc2FtZVxuICAgICAgICAvLyB3YXkgdGhhdCB3ZSB3YW50ZWQgdG8uIFNvLCBqdXN0IHJlbG9hZCB0aGUgc2NoZW1hXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH0pXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgY2xhc3NOYW1lLFxuICAgICAgICAgIGZpZWxkTmFtZSxcbiAgICAgICAgICB0eXBlLFxuICAgICAgICB9O1xuICAgICAgfSk7XG4gIH1cblxuICBlbnN1cmVGaWVsZHMoZmllbGRzOiBhbnkpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpZWxkcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgY29uc3QgeyBjbGFzc05hbWUsIGZpZWxkTmFtZSB9ID0gZmllbGRzW2ldO1xuICAgICAgbGV0IHsgdHlwZSB9ID0gZmllbGRzW2ldO1xuICAgICAgY29uc3QgZXhwZWN0ZWRUeXBlID0gdGhpcy5nZXRFeHBlY3RlZFR5cGUoY2xhc3NOYW1lLCBmaWVsZE5hbWUpO1xuICAgICAgaWYgKHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJykge1xuICAgICAgICB0eXBlID0geyB0eXBlOiB0eXBlIH07XG4gICAgICB9XG4gICAgICBpZiAoIWV4cGVjdGVkVHlwZSB8fCAhZGJUeXBlTWF0Y2hlc09iamVjdFR5cGUoZXhwZWN0ZWRUeXBlLCB0eXBlKSkge1xuICAgICAgICB0aHJvdyBuZXcgUGFyc2UuRXJyb3IoUGFyc2UuRXJyb3IuSU5WQUxJRF9KU09OLCBgQ291bGQgbm90IGFkZCBmaWVsZCAke2ZpZWxkTmFtZX1gKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBtYWludGFpbiBjb21wYXRpYmlsaXR5XG4gIGRlbGV0ZUZpZWxkKGZpZWxkTmFtZTogc3RyaW5nLCBjbGFzc05hbWU6IHN0cmluZywgZGF0YWJhc2U6IERhdGFiYXNlQ29udHJvbGxlcikge1xuICAgIHJldHVybiB0aGlzLmRlbGV0ZUZpZWxkcyhbZmllbGROYW1lXSwgY2xhc3NOYW1lLCBkYXRhYmFzZSk7XG4gIH1cblxuICAvLyBEZWxldGUgZmllbGRzLCBhbmQgcmVtb3ZlIHRoYXQgZGF0YSBmcm9tIGFsbCBvYmplY3RzLiBUaGlzIGlzIGludGVuZGVkXG4gIC8vIHRvIHJlbW92ZSB1bnVzZWQgZmllbGRzLCBpZiBvdGhlciB3cml0ZXJzIGFyZSB3cml0aW5nIG9iamVjdHMgdGhhdCBpbmNsdWRlXG4gIC8vIHRoaXMgZmllbGQsIHRoZSBmaWVsZCBtYXkgcmVhcHBlYXIuIFJldHVybnMgYSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2l0aFxuICAvLyBubyBvYmplY3Qgb24gc3VjY2Vzcywgb3IgcmVqZWN0cyB3aXRoIHsgY29kZSwgZXJyb3IgfSBvbiBmYWlsdXJlLlxuICAvLyBQYXNzaW5nIHRoZSBkYXRhYmFzZSBhbmQgcHJlZml4IGlzIG5lY2Vzc2FyeSBpbiBvcmRlciB0byBkcm9wIHJlbGF0aW9uIGNvbGxlY3Rpb25zXG4gIC8vIGFuZCByZW1vdmUgZmllbGRzIGZyb20gb2JqZWN0cy4gSWRlYWxseSB0aGUgZGF0YWJhc2Ugd291bGQgYmVsb25nIHRvXG4gIC8vIGEgZGF0YWJhc2UgYWRhcHRlciBhbmQgdGhpcyBmdW5jdGlvbiB3b3VsZCBjbG9zZSBvdmVyIGl0IG9yIGFjY2VzcyBpdCB2aWEgbWVtYmVyLlxuICBkZWxldGVGaWVsZHMoZmllbGROYW1lczogQXJyYXk8c3RyaW5nPiwgY2xhc3NOYW1lOiBzdHJpbmcsIGRhdGFiYXNlOiBEYXRhYmFzZUNvbnRyb2xsZXIpIHtcbiAgICBpZiAoIWNsYXNzTmFtZUlzVmFsaWQoY2xhc3NOYW1lKSkge1xuICAgICAgdGhyb3cgbmV3IFBhcnNlLkVycm9yKFBhcnNlLkVycm9yLklOVkFMSURfQ0xBU1NfTkFNRSwgaW52YWxpZENsYXNzTmFtZU1lc3NhZ2UoY2xhc3NOYW1lKSk7XG4gICAgfVxuXG4gICAgZmllbGROYW1lcy5mb3JFYWNoKGZpZWxkTmFtZSA9PiB7XG4gICAgICBpZiAoIWZpZWxkTmFtZUlzVmFsaWQoZmllbGROYW1lLCBjbGFzc05hbWUpKSB7XG4gICAgICAgIHRocm93IG5ldyBQYXJzZS5FcnJvcihQYXJzZS5FcnJvci5JTlZBTElEX0tFWV9OQU1FLCBgaW52YWxpZCBmaWVsZCBuYW1lOiAke2ZpZWxkTmFtZX1gKTtcbiAgICAgIH1cbiAgICAgIC8vRG9uJ3QgYWxsb3cgZGVsZXRpbmcgdGhlIGRlZmF1bHQgZmllbGRzLlxuICAgICAgaWYgKCFmaWVsZE5hbWVJc1ZhbGlkRm9yQ2xhc3MoZmllbGROYW1lLCBjbGFzc05hbWUpKSB7XG4gICAgICAgIHRocm93IG5ldyBQYXJzZS5FcnJvcigxMzYsIGBmaWVsZCAke2ZpZWxkTmFtZX0gY2Fubm90IGJlIGNoYW5nZWRgKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzLmdldE9uZVNjaGVtYShjbGFzc05hbWUsIGZhbHNlLCB7IGNsZWFyQ2FjaGU6IHRydWUgfSlcbiAgICAgIC5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgIGlmIChlcnJvciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFBhcnNlLkVycm9yKFxuICAgICAgICAgICAgUGFyc2UuRXJyb3IuSU5WQUxJRF9DTEFTU19OQU1FLFxuICAgICAgICAgICAgYENsYXNzICR7Y2xhc3NOYW1lfSBkb2VzIG5vdCBleGlzdC5gXG4gICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC50aGVuKHNjaGVtYSA9PiB7XG4gICAgICAgIGZpZWxkTmFtZXMuZm9yRWFjaChmaWVsZE5hbWUgPT4ge1xuICAgICAgICAgIGlmICghc2NoZW1hLmZpZWxkc1tmaWVsZE5hbWVdKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgUGFyc2UuRXJyb3IoMjU1LCBgRmllbGQgJHtmaWVsZE5hbWV9IGRvZXMgbm90IGV4aXN0LCBjYW5ub3QgZGVsZXRlLmApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3Qgc2NoZW1hRmllbGRzID0geyAuLi5zY2hlbWEuZmllbGRzIH07XG4gICAgICAgIHJldHVybiBkYXRhYmFzZS5hZGFwdGVyLmRlbGV0ZUZpZWxkcyhjbGFzc05hbWUsIHNjaGVtYSwgZmllbGROYW1lcykudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFxuICAgICAgICAgICAgZmllbGROYW1lcy5tYXAoZmllbGROYW1lID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgZmllbGQgPSBzY2hlbWFGaWVsZHNbZmllbGROYW1lXTtcbiAgICAgICAgICAgICAgaWYgKGZpZWxkICYmIGZpZWxkLnR5cGUgPT09ICdSZWxhdGlvbicpIHtcbiAgICAgICAgICAgICAgICAvL0ZvciByZWxhdGlvbnMsIGRyb3AgdGhlIF9Kb2luIHRhYmxlXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGFiYXNlLmFkYXB0ZXIuZGVsZXRlQ2xhc3MoYF9Kb2luOiR7ZmllbGROYW1lfToke2NsYXNzTmFtZX1gKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuICAgICAgfSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgU2NoZW1hQ2FjaGUuY2xlYXIoKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgLy8gVmFsaWRhdGVzIGFuIG9iamVjdCBwcm92aWRlZCBpbiBSRVNUIGZvcm1hdC5cbiAgLy8gUmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB0byB0aGUgbmV3IHNjaGVtYSBpZiB0aGlzIG9iamVjdCBpc1xuICAvLyB2YWxpZC5cbiAgYXN5bmMgdmFsaWRhdGVPYmplY3QoY2xhc3NOYW1lOiBzdHJpbmcsIG9iamVjdDogYW55LCBxdWVyeTogYW55KSB7XG4gICAgbGV0IGdlb2NvdW50ID0gMDtcbiAgICBjb25zdCBzY2hlbWEgPSBhd2FpdCB0aGlzLmVuZm9yY2VDbGFzc0V4aXN0cyhjbGFzc05hbWUpO1xuICAgIGNvbnN0IHByb21pc2VzID0gW107XG5cbiAgICBmb3IgKGNvbnN0IGZpZWxkTmFtZSBpbiBvYmplY3QpIHtcbiAgICAgIGlmIChvYmplY3RbZmllbGROYW1lXSAmJiBnZXRUeXBlKG9iamVjdFtmaWVsZE5hbWVdKSA9PT0gJ0dlb1BvaW50Jykge1xuICAgICAgICBnZW9jb3VudCsrO1xuICAgICAgfVxuICAgICAgaWYgKGdlb2NvdW50ID4gMSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoXG4gICAgICAgICAgbmV3IFBhcnNlLkVycm9yKFxuICAgICAgICAgICAgUGFyc2UuRXJyb3IuSU5DT1JSRUNUX1RZUEUsXG4gICAgICAgICAgICAndGhlcmUgY2FuIG9ubHkgYmUgb25lIGdlb3BvaW50IGZpZWxkIGluIGEgY2xhc3MnXG4gICAgICAgICAgKVxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGNvbnN0IGZpZWxkTmFtZSBpbiBvYmplY3QpIHtcbiAgICAgIGlmIChvYmplY3RbZmllbGROYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgZXhwZWN0ZWQgPSBnZXRUeXBlKG9iamVjdFtmaWVsZE5hbWVdKTtcbiAgICAgIGlmICghZXhwZWN0ZWQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAoZmllbGROYW1lID09PSAnQUNMJykge1xuICAgICAgICAvLyBFdmVyeSBvYmplY3QgaGFzIEFDTCBpbXBsaWNpdGx5LlxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHByb21pc2VzLnB1c2goc2NoZW1hLmVuZm9yY2VGaWVsZEV4aXN0cyhjbGFzc05hbWUsIGZpZWxkTmFtZSwgZXhwZWN0ZWQpKTtcbiAgICB9XG4gICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsKHByb21pc2VzKTtcbiAgICBjb25zdCBlbmZvcmNlRmllbGRzID0gcmVzdWx0cy5maWx0ZXIocmVzdWx0ID0+ICEhcmVzdWx0KTtcblxuICAgIGlmIChlbmZvcmNlRmllbGRzLmxlbmd0aCAhPT0gMCkge1xuICAgICAgLy8gVE9ETzogUmVtb3ZlIGJ5IHVwZGF0aW5nIHNjaGVtYSBjYWNoZSBkaXJlY3RseVxuICAgICAgYXdhaXQgdGhpcy5yZWxvYWREYXRhKHsgY2xlYXJDYWNoZTogdHJ1ZSB9KTtcbiAgICB9XG4gICAgdGhpcy5lbnN1cmVGaWVsZHMoZW5mb3JjZUZpZWxkcyk7XG5cbiAgICBjb25zdCBwcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKHNjaGVtYSk7XG4gICAgcmV0dXJuIHRoZW5WYWxpZGF0ZVJlcXVpcmVkQ29sdW1ucyhwcm9taXNlLCBjbGFzc05hbWUsIG9iamVjdCwgcXVlcnkpO1xuICB9XG5cbiAgLy8gVmFsaWRhdGVzIHRoYXQgYWxsIHRoZSBwcm9wZXJ0aWVzIGFyZSBzZXQgZm9yIHRoZSBvYmplY3RcbiAgdmFsaWRhdGVSZXF1aXJlZENvbHVtbnMoY2xhc3NOYW1lOiBzdHJpbmcsIG9iamVjdDogYW55LCBxdWVyeTogYW55KSB7XG4gICAgY29uc3QgY29sdW1ucyA9IHJlcXVpcmVkQ29sdW1uc1tjbGFzc05hbWVdO1xuICAgIGlmICghY29sdW1ucyB8fCBjb2x1bW5zLmxlbmd0aCA9PSAwKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMpO1xuICAgIH1cblxuICAgIGNvbnN0IG1pc3NpbmdDb2x1bW5zID0gY29sdW1ucy5maWx0ZXIoZnVuY3Rpb24gKGNvbHVtbikge1xuICAgICAgaWYgKHF1ZXJ5ICYmIHF1ZXJ5Lm9iamVjdElkKSB7XG4gICAgICAgIGlmIChvYmplY3RbY29sdW1uXSAmJiB0eXBlb2Ygb2JqZWN0W2NvbHVtbl0gPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgLy8gVHJ5aW5nIHRvIGRlbGV0ZSBhIHJlcXVpcmVkIGNvbHVtblxuICAgICAgICAgIHJldHVybiBvYmplY3RbY29sdW1uXS5fX29wID09ICdEZWxldGUnO1xuICAgICAgICB9XG4gICAgICAgIC8vIE5vdCB0cnlpbmcgdG8gZG8gYW55dGhpbmcgdGhlcmVcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuICFvYmplY3RbY29sdW1uXTtcbiAgICB9KTtcblxuICAgIGlmIChtaXNzaW5nQ29sdW1ucy5sZW5ndGggPiAwKSB7XG4gICAgICB0aHJvdyBuZXcgUGFyc2UuRXJyb3IoUGFyc2UuRXJyb3IuSU5DT1JSRUNUX1RZUEUsIG1pc3NpbmdDb2x1bW5zWzBdICsgJyBpcyByZXF1aXJlZC4nKTtcbiAgICB9XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzKTtcbiAgfVxuXG4gIHRlc3RQZXJtaXNzaW9uc0ZvckNsYXNzTmFtZShjbGFzc05hbWU6IHN0cmluZywgYWNsR3JvdXA6IHN0cmluZ1tdLCBvcGVyYXRpb246IHN0cmluZykge1xuICAgIHJldHVybiBTY2hlbWFDb250cm9sbGVyLnRlc3RQZXJtaXNzaW9ucyhcbiAgICAgIHRoaXMuZ2V0Q2xhc3NMZXZlbFBlcm1pc3Npb25zKGNsYXNzTmFtZSksXG4gICAgICBhY2xHcm91cCxcbiAgICAgIG9wZXJhdGlvblxuICAgICk7XG4gIH1cblxuICAvLyBUZXN0cyB0aGF0IHRoZSBjbGFzcyBsZXZlbCBwZXJtaXNzaW9uIGxldCBwYXNzIHRoZSBvcGVyYXRpb24gZm9yIGEgZ2l2ZW4gYWNsR3JvdXBcbiAgc3RhdGljIHRlc3RQZXJtaXNzaW9ucyhjbGFzc1Blcm1pc3Npb25zOiA/YW55LCBhY2xHcm91cDogc3RyaW5nW10sIG9wZXJhdGlvbjogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKCFjbGFzc1Blcm1pc3Npb25zIHx8ICFjbGFzc1Blcm1pc3Npb25zW29wZXJhdGlvbl0pIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBjb25zdCBwZXJtcyA9IGNsYXNzUGVybWlzc2lvbnNbb3BlcmF0aW9uXTtcbiAgICBpZiAocGVybXNbJyonXSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8vIENoZWNrIHBlcm1pc3Npb25zIGFnYWluc3QgdGhlIGFjbEdyb3VwIHByb3ZpZGVkIChhcnJheSBvZiB1c2VySWQvcm9sZXMpXG4gICAgaWYgKFxuICAgICAgYWNsR3JvdXAuc29tZShhY2wgPT4ge1xuICAgICAgICByZXR1cm4gcGVybXNbYWNsXSA9PT0gdHJ1ZTtcbiAgICAgIH0pXG4gICAgKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gVmFsaWRhdGVzIGFuIG9wZXJhdGlvbiBwYXNzZXMgY2xhc3MtbGV2ZWwtcGVybWlzc2lvbnMgc2V0IGluIHRoZSBzY2hlbWFcbiAgc3RhdGljIHZhbGlkYXRlUGVybWlzc2lvbihcbiAgICBjbGFzc1Blcm1pc3Npb25zOiA/YW55LFxuICAgIGNsYXNzTmFtZTogc3RyaW5nLFxuICAgIGFjbEdyb3VwOiBzdHJpbmdbXSxcbiAgICBvcGVyYXRpb246IHN0cmluZyxcbiAgICBhY3Rpb24/OiBzdHJpbmdcbiAgKSB7XG4gICAgaWYgKFNjaGVtYUNvbnRyb2xsZXIudGVzdFBlcm1pc3Npb25zKGNsYXNzUGVybWlzc2lvbnMsIGFjbEdyb3VwLCBvcGVyYXRpb24pKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgaWYgKCFjbGFzc1Blcm1pc3Npb25zIHx8ICFjbGFzc1Blcm1pc3Npb25zW29wZXJhdGlvbl0pIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBjb25zdCBwZXJtcyA9IGNsYXNzUGVybWlzc2lvbnNbb3BlcmF0aW9uXTtcbiAgICAvLyBJZiBvbmx5IGZvciBhdXRoZW50aWNhdGVkIHVzZXJzXG4gICAgLy8gbWFrZSBzdXJlIHdlIGhhdmUgYW4gYWNsR3JvdXBcbiAgICBpZiAocGVybXNbJ3JlcXVpcmVzQXV0aGVudGljYXRpb24nXSkge1xuICAgICAgLy8gSWYgYWNsR3JvdXAgaGFzICogKHB1YmxpYylcbiAgICAgIGlmICghYWNsR3JvdXAgfHwgYWNsR3JvdXAubGVuZ3RoID09IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IFBhcnNlLkVycm9yKFxuICAgICAgICAgIFBhcnNlLkVycm9yLk9CSkVDVF9OT1RfRk9VTkQsXG4gICAgICAgICAgJ1Blcm1pc3Npb24gZGVuaWVkLCB1c2VyIG5lZWRzIHRvIGJlIGF1dGhlbnRpY2F0ZWQuJ1xuICAgICAgICApO1xuICAgICAgfSBlbHNlIGlmIChhY2xHcm91cC5pbmRleE9mKCcqJykgPiAtMSAmJiBhY2xHcm91cC5sZW5ndGggPT0gMSkge1xuICAgICAgICB0aHJvdyBuZXcgUGFyc2UuRXJyb3IoXG4gICAgICAgICAgUGFyc2UuRXJyb3IuT0JKRUNUX05PVF9GT1VORCxcbiAgICAgICAgICAnUGVybWlzc2lvbiBkZW5pZWQsIHVzZXIgbmVlZHMgdG8gYmUgYXV0aGVudGljYXRlZC4nXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICAvLyByZXF1aXJlc0F1dGhlbnRpY2F0aW9uIHBhc3NlZCwganVzdCBtb3ZlIGZvcndhcmRcbiAgICAgIC8vIHByb2JhYmx5IHdvdWxkIGJlIHdpc2UgYXQgc29tZSBwb2ludCB0byByZW5hbWUgdG8gJ2F1dGhlbnRpY2F0ZWRVc2VyJ1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cblxuICAgIC8vIE5vIG1hdGNoaW5nIENMUCwgbGV0J3MgY2hlY2sgdGhlIFBvaW50ZXIgcGVybWlzc2lvbnNcbiAgICAvLyBBbmQgaGFuZGxlIHRob3NlIGxhdGVyXG4gICAgY29uc3QgcGVybWlzc2lvbkZpZWxkID1cbiAgICAgIFsnZ2V0JywgJ2ZpbmQnLCAnY291bnQnXS5pbmRleE9mKG9wZXJhdGlvbikgPiAtMSA/ICdyZWFkVXNlckZpZWxkcycgOiAnd3JpdGVVc2VyRmllbGRzJztcblxuICAgIC8vIFJlamVjdCBjcmVhdGUgd2hlbiB3cml0ZSBsb2NrZG93blxuICAgIGlmIChwZXJtaXNzaW9uRmllbGQgPT0gJ3dyaXRlVXNlckZpZWxkcycgJiYgb3BlcmF0aW9uID09ICdjcmVhdGUnKSB7XG4gICAgICB0aHJvdyBuZXcgUGFyc2UuRXJyb3IoXG4gICAgICAgIFBhcnNlLkVycm9yLk9QRVJBVElPTl9GT1JCSURERU4sXG4gICAgICAgIGBQZXJtaXNzaW9uIGRlbmllZCBmb3IgYWN0aW9uICR7b3BlcmF0aW9ufSBvbiBjbGFzcyAke2NsYXNzTmFtZX0uYFxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBQcm9jZXNzIHRoZSByZWFkVXNlckZpZWxkcyBsYXRlclxuICAgIGlmIChcbiAgICAgIEFycmF5LmlzQXJyYXkoY2xhc3NQZXJtaXNzaW9uc1twZXJtaXNzaW9uRmllbGRdKSAmJlxuICAgICAgY2xhc3NQZXJtaXNzaW9uc1twZXJtaXNzaW9uRmllbGRdLmxlbmd0aCA+IDBcbiAgICApIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG5cbiAgICBjb25zdCBwb2ludGVyRmllbGRzID0gY2xhc3NQZXJtaXNzaW9uc1tvcGVyYXRpb25dLnBvaW50ZXJGaWVsZHM7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkocG9pbnRlckZpZWxkcykgJiYgcG9pbnRlckZpZWxkcy5sZW5ndGggPiAwKSB7XG4gICAgICAvLyBhbnkgb3AgZXhjZXB0ICdhZGRGaWVsZCBhcyBwYXJ0IG9mIGNyZWF0ZScgaXMgb2suXG4gICAgICBpZiAob3BlcmF0aW9uICE9PSAnYWRkRmllbGQnIHx8IGFjdGlvbiA9PT0gJ3VwZGF0ZScpIHtcbiAgICAgICAgLy8gV2UgY2FuIGFsbG93IGFkZGluZyBmaWVsZCBvbiB1cGRhdGUgZmxvdyBvbmx5LlxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IFBhcnNlLkVycm9yKFxuICAgICAgUGFyc2UuRXJyb3IuT1BFUkFUSU9OX0ZPUkJJRERFTixcbiAgICAgIGBQZXJtaXNzaW9uIGRlbmllZCBmb3IgYWN0aW9uICR7b3BlcmF0aW9ufSBvbiBjbGFzcyAke2NsYXNzTmFtZX0uYFxuICAgICk7XG4gIH1cblxuICAvLyBWYWxpZGF0ZXMgYW4gb3BlcmF0aW9uIHBhc3NlcyBjbGFzcy1sZXZlbC1wZXJtaXNzaW9ucyBzZXQgaW4gdGhlIHNjaGVtYVxuICB2YWxpZGF0ZVBlcm1pc3Npb24oY2xhc3NOYW1lOiBzdHJpbmcsIGFjbEdyb3VwOiBzdHJpbmdbXSwgb3BlcmF0aW9uOiBzdHJpbmcsIGFjdGlvbj86IHN0cmluZykge1xuICAgIHJldHVybiBTY2hlbWFDb250cm9sbGVyLnZhbGlkYXRlUGVybWlzc2lvbihcbiAgICAgIHRoaXMuZ2V0Q2xhc3NMZXZlbFBlcm1pc3Npb25zKGNsYXNzTmFtZSksXG4gICAgICBjbGFzc05hbWUsXG4gICAgICBhY2xHcm91cCxcbiAgICAgIG9wZXJhdGlvbixcbiAgICAgIGFjdGlvblxuICAgICk7XG4gIH1cblxuICBnZXRDbGFzc0xldmVsUGVybWlzc2lvbnMoY2xhc3NOYW1lOiBzdHJpbmcpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLnNjaGVtYURhdGFbY2xhc3NOYW1lXSAmJiB0aGlzLnNjaGVtYURhdGFbY2xhc3NOYW1lXS5jbGFzc0xldmVsUGVybWlzc2lvbnM7XG4gIH1cblxuICAvLyBSZXR1cm5zIHRoZSBleHBlY3RlZCB0eXBlIGZvciBhIGNsYXNzTmFtZStrZXkgY29tYmluYXRpb25cbiAgLy8gb3IgdW5kZWZpbmVkIGlmIHRoZSBzY2hlbWEgaXMgbm90IHNldFxuICBnZXRFeHBlY3RlZFR5cGUoY2xhc3NOYW1lOiBzdHJpbmcsIGZpZWxkTmFtZTogc3RyaW5nKTogPyhTY2hlbWFGaWVsZCB8IHN0cmluZykge1xuICAgIGlmICh0aGlzLnNjaGVtYURhdGFbY2xhc3NOYW1lXSkge1xuICAgICAgY29uc3QgZXhwZWN0ZWRUeXBlID0gdGhpcy5zY2hlbWFEYXRhW2NsYXNzTmFtZV0uZmllbGRzW2ZpZWxkTmFtZV07XG4gICAgICByZXR1cm4gZXhwZWN0ZWRUeXBlID09PSAnbWFwJyA/ICdPYmplY3QnIDogZXhwZWN0ZWRUeXBlO1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgLy8gQ2hlY2tzIGlmIGEgZ2l2ZW4gY2xhc3MgaXMgaW4gdGhlIHNjaGVtYS5cbiAgaGFzQ2xhc3MoY2xhc3NOYW1lOiBzdHJpbmcpIHtcbiAgICBpZiAodGhpcy5zY2hlbWFEYXRhW2NsYXNzTmFtZV0pIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodHJ1ZSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnJlbG9hZERhdGEoKS50aGVuKCgpID0+ICEhdGhpcy5zY2hlbWFEYXRhW2NsYXNzTmFtZV0pO1xuICB9XG59XG5cbi8vIFJldHVybnMgYSBwcm9taXNlIGZvciBhIG5ldyBTY2hlbWEuXG5jb25zdCBsb2FkID0gKGRiQWRhcHRlcjogU3RvcmFnZUFkYXB0ZXIsIG9wdGlvbnM6IGFueSk6IFByb21pc2U8U2NoZW1hQ29udHJvbGxlcj4gPT4ge1xuICBjb25zdCBzY2hlbWEgPSBuZXcgU2NoZW1hQ29udHJvbGxlcihkYkFkYXB0ZXIpO1xuICByZXR1cm4gc2NoZW1hLnJlbG9hZERhdGEob3B0aW9ucykudGhlbigoKSA9PiBzY2hlbWEpO1xufTtcblxuLy8gQnVpbGRzIGEgbmV3IHNjaGVtYSAoaW4gc2NoZW1hIEFQSSByZXNwb25zZSBmb3JtYXQpIG91dCBvZiBhblxuLy8gZXhpc3RpbmcgbW9uZ28gc2NoZW1hICsgYSBzY2hlbWFzIEFQSSBwdXQgcmVxdWVzdC4gVGhpcyByZXNwb25zZVxuLy8gZG9lcyBub3QgaW5jbHVkZSB0aGUgZGVmYXVsdCBmaWVsZHMsIGFzIGl0IGlzIGludGVuZGVkIHRvIGJlIHBhc3NlZFxuLy8gdG8gbW9uZ29TY2hlbWFGcm9tRmllbGRzQW5kQ2xhc3NOYW1lLiBObyB2YWxpZGF0aW9uIGlzIGRvbmUgaGVyZSwgaXRcbi8vIGlzIGRvbmUgaW4gbW9uZ29TY2hlbWFGcm9tRmllbGRzQW5kQ2xhc3NOYW1lLlxuZnVuY3Rpb24gYnVpbGRNZXJnZWRTY2hlbWFPYmplY3QoZXhpc3RpbmdGaWVsZHM6IFNjaGVtYUZpZWxkcywgcHV0UmVxdWVzdDogYW55KTogU2NoZW1hRmllbGRzIHtcbiAgY29uc3QgbmV3U2NoZW1hID0ge307XG4gIC8vIEBmbG93LWRpc2FibGUtbmV4dFxuICBjb25zdCBzeXNTY2hlbWFGaWVsZCA9XG4gICAgT2JqZWN0LmtleXMoZGVmYXVsdENvbHVtbnMpLmluZGV4T2YoZXhpc3RpbmdGaWVsZHMuX2lkKSA9PT0gLTFcbiAgICAgID8gW11cbiAgICAgIDogT2JqZWN0LmtleXMoZGVmYXVsdENvbHVtbnNbZXhpc3RpbmdGaWVsZHMuX2lkXSk7XG4gIGZvciAoY29uc3Qgb2xkRmllbGQgaW4gZXhpc3RpbmdGaWVsZHMpIHtcbiAgICBpZiAoXG4gICAgICBvbGRGaWVsZCAhPT0gJ19pZCcgJiZcbiAgICAgIG9sZEZpZWxkICE9PSAnQUNMJyAmJlxuICAgICAgb2xkRmllbGQgIT09ICd1cGRhdGVkQXQnICYmXG4gICAgICBvbGRGaWVsZCAhPT0gJ2NyZWF0ZWRBdCcgJiZcbiAgICAgIG9sZEZpZWxkICE9PSAnb2JqZWN0SWQnXG4gICAgKSB7XG4gICAgICBpZiAoc3lzU2NoZW1hRmllbGQubGVuZ3RoID4gMCAmJiBzeXNTY2hlbWFGaWVsZC5pbmRleE9mKG9sZEZpZWxkKSAhPT0gLTEpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCBmaWVsZElzRGVsZXRlZCA9IHB1dFJlcXVlc3Rbb2xkRmllbGRdICYmIHB1dFJlcXVlc3Rbb2xkRmllbGRdLl9fb3AgPT09ICdEZWxldGUnO1xuICAgICAgaWYgKCFmaWVsZElzRGVsZXRlZCkge1xuICAgICAgICBuZXdTY2hlbWFbb2xkRmllbGRdID0gZXhpc3RpbmdGaWVsZHNbb2xkRmllbGRdO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBmb3IgKGNvbnN0IG5ld0ZpZWxkIGluIHB1dFJlcXVlc3QpIHtcbiAgICBpZiAobmV3RmllbGQgIT09ICdvYmplY3RJZCcgJiYgcHV0UmVxdWVzdFtuZXdGaWVsZF0uX19vcCAhPT0gJ0RlbGV0ZScpIHtcbiAgICAgIGlmIChzeXNTY2hlbWFGaWVsZC5sZW5ndGggPiAwICYmIHN5c1NjaGVtYUZpZWxkLmluZGV4T2YobmV3RmllbGQpICE9PSAtMSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIG5ld1NjaGVtYVtuZXdGaWVsZF0gPSBwdXRSZXF1ZXN0W25ld0ZpZWxkXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5ld1NjaGVtYTtcbn1cblxuLy8gR2l2ZW4gYSBzY2hlbWEgcHJvbWlzZSwgY29uc3RydWN0IGFub3RoZXIgc2NoZW1hIHByb21pc2UgdGhhdFxuLy8gdmFsaWRhdGVzIHRoaXMgZmllbGQgb25jZSB0aGUgc2NoZW1hIGxvYWRzLlxuZnVuY3Rpb24gdGhlblZhbGlkYXRlUmVxdWlyZWRDb2x1bW5zKHNjaGVtYVByb21pc2UsIGNsYXNzTmFtZSwgb2JqZWN0LCBxdWVyeSkge1xuICByZXR1cm4gc2NoZW1hUHJvbWlzZS50aGVuKHNjaGVtYSA9PiB7XG4gICAgcmV0dXJuIHNjaGVtYS52YWxpZGF0ZVJlcXVpcmVkQ29sdW1ucyhjbGFzc05hbWUsIG9iamVjdCwgcXVlcnkpO1xuICB9KTtcbn1cblxuLy8gR2V0cyB0aGUgdHlwZSBmcm9tIGEgUkVTVCBBUEkgZm9ybWF0dGVkIG9iamVjdCwgd2hlcmUgJ3R5cGUnIGlzXG4vLyBleHRlbmRlZCBwYXN0IGphdmFzY3JpcHQgdHlwZXMgdG8gaW5jbHVkZSB0aGUgcmVzdCBvZiB0aGUgUGFyc2Vcbi8vIHR5cGUgc3lzdGVtLlxuLy8gVGhlIG91dHB1dCBzaG91bGQgYmUgYSB2YWxpZCBzY2hlbWEgdmFsdWUuXG4vLyBUT0RPOiBlbnN1cmUgdGhhdCB0aGlzIGlzIGNvbXBhdGlibGUgd2l0aCB0aGUgZm9ybWF0IHVzZWQgaW4gT3BlbiBEQlxuZnVuY3Rpb24gZ2V0VHlwZShvYmo6IGFueSk6ID8oU2NoZW1hRmllbGQgfCBzdHJpbmcpIHtcbiAgY29uc3QgdHlwZSA9IHR5cGVvZiBvYmo7XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgcmV0dXJuICdCb29sZWFuJztcbiAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgcmV0dXJuICdTdHJpbmcnO1xuICAgIGNhc2UgJ251bWJlcic6XG4gICAgICByZXR1cm4gJ051bWJlcic7XG4gICAgY2FzZSAnbWFwJzpcbiAgICBjYXNlICdvYmplY3QnOlxuICAgICAgaWYgKCFvYmopIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBnZXRPYmplY3RUeXBlKG9iaik7XG4gICAgY2FzZSAnZnVuY3Rpb24nOlxuICAgIGNhc2UgJ3N5bWJvbCc6XG4gICAgY2FzZSAndW5kZWZpbmVkJzpcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgJ2JhZCBvYmo6ICcgKyBvYmo7XG4gIH1cbn1cblxuLy8gVGhpcyBnZXRzIHRoZSB0eXBlIGZvciBub24tSlNPTiB0eXBlcyBsaWtlIHBvaW50ZXJzIGFuZCBmaWxlcywgYnV0XG4vLyBhbHNvIGdldHMgdGhlIGFwcHJvcHJpYXRlIHR5cGUgZm9yICQgb3BlcmF0b3JzLlxuLy8gUmV0dXJucyBudWxsIGlmIHRoZSB0eXBlIGlzIHVua25vd24uXG5mdW5jdGlvbiBnZXRPYmplY3RUeXBlKG9iaik6ID8oU2NoZW1hRmllbGQgfCBzdHJpbmcpIHtcbiAgaWYgKG9iaiBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgcmV0dXJuICdBcnJheSc7XG4gIH1cbiAgaWYgKG9iai5fX3R5cGUpIHtcbiAgICBzd2l0Y2ggKG9iai5fX3R5cGUpIHtcbiAgICAgIGNhc2UgJ1BvaW50ZXInOlxuICAgICAgICBpZiAob2JqLmNsYXNzTmFtZSkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAnUG9pbnRlcicsXG4gICAgICAgICAgICB0YXJnZXRDbGFzczogb2JqLmNsYXNzTmFtZSxcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnUmVsYXRpb24nOlxuICAgICAgICBpZiAob2JqLmNsYXNzTmFtZSkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAnUmVsYXRpb24nLFxuICAgICAgICAgICAgdGFyZ2V0Q2xhc3M6IG9iai5jbGFzc05hbWUsXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ0ZpbGUnOlxuICAgICAgICBpZiAob2JqLm5hbWUpIHtcbiAgICAgICAgICByZXR1cm4gJ0ZpbGUnO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnRGF0ZSc6XG4gICAgICAgIGlmIChvYmouaXNvKSB7XG4gICAgICAgICAgcmV0dXJuICdEYXRlJztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ0dlb1BvaW50JzpcbiAgICAgICAgaWYgKG9iai5sYXRpdHVkZSAhPSBudWxsICYmIG9iai5sb25naXR1ZGUgIT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiAnR2VvUG9pbnQnO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnQnl0ZXMnOlxuICAgICAgICBpZiAob2JqLmJhc2U2NCkge1xuICAgICAgICAgIHJldHVybiAnQnl0ZXMnO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnUG9seWdvbic6XG4gICAgICAgIGlmIChvYmouY29vcmRpbmF0ZXMpIHtcbiAgICAgICAgICByZXR1cm4gJ1BvbHlnb24nO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgUGFyc2UuRXJyb3IoUGFyc2UuRXJyb3IuSU5DT1JSRUNUX1RZUEUsICdUaGlzIGlzIG5vdCBhIHZhbGlkICcgKyBvYmouX190eXBlKTtcbiAgfVxuICBpZiAob2JqWyckbmUnXSkge1xuICAgIHJldHVybiBnZXRPYmplY3RUeXBlKG9ialsnJG5lJ10pO1xuICB9XG4gIGlmIChvYmouX19vcCkge1xuICAgIHN3aXRjaCAob2JqLl9fb3ApIHtcbiAgICAgIGNhc2UgJ0luY3JlbWVudCc6XG4gICAgICAgIHJldHVybiAnTnVtYmVyJztcbiAgICAgIGNhc2UgJ0RlbGV0ZSc6XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgY2FzZSAnQWRkJzpcbiAgICAgIGNhc2UgJ0FkZFVuaXF1ZSc6XG4gICAgICBjYXNlICdSZW1vdmUnOlxuICAgICAgICByZXR1cm4gJ0FycmF5JztcbiAgICAgIGNhc2UgJ0FkZFJlbGF0aW9uJzpcbiAgICAgIGNhc2UgJ1JlbW92ZVJlbGF0aW9uJzpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0eXBlOiAnUmVsYXRpb24nLFxuICAgICAgICAgIHRhcmdldENsYXNzOiBvYmoub2JqZWN0c1swXS5jbGFzc05hbWUsXG4gICAgICAgIH07XG4gICAgICBjYXNlICdCYXRjaCc6XG4gICAgICAgIHJldHVybiBnZXRPYmplY3RUeXBlKG9iai5vcHNbMF0pO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgJ3VuZXhwZWN0ZWQgb3A6ICcgKyBvYmouX19vcDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuICdPYmplY3QnO1xufVxuXG5leHBvcnQge1xuICBsb2FkLFxuICBjbGFzc05hbWVJc1ZhbGlkLFxuICBmaWVsZE5hbWVJc1ZhbGlkLFxuICBpbnZhbGlkQ2xhc3NOYW1lTWVzc2FnZSxcbiAgYnVpbGRNZXJnZWRTY2hlbWFPYmplY3QsXG4gIHN5c3RlbUNsYXNzZXMsXG4gIGRlZmF1bHRDb2x1bW5zLFxuICBjb252ZXJ0U2NoZW1hVG9BZGFwdGVyU2NoZW1hLFxuICBWb2xhdGlsZUNsYXNzZXNTY2hlbWFzLFxuICBTY2hlbWFDb250cm9sbGVyLFxufTtcbiJdfQ==