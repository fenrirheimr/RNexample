import Joi from 'joi';
import AbstractModel from './AbstractModel';

export default class ApiKeyModel extends AbstractModel {
  static get schema() {
    return {
      principal: Joi.string().required(),
      key: Joi.string().required(),
      secret: Joi.string().required(),
      createdAt: Joi.string().required(),
      live: Joi.boolean().required(),
      active: Joi.boolean().required(),
      generalOperationAvailable: Joi.boolean().required(),
      tradeAvailable: Joi.boolean().required(),
      withdrawAvailable: Joi.boolean().required(),
    };
  }
  constructor(data, options) {
    super(data, options);
    Object.freeze(this);
  }

  static fromJson(data) {
    return new ApiKeyModel({
      ...data,
    });
  }
}
