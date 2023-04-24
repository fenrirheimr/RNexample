import Joi from 'joi';
import AbstractModel from './AbstractModel';
import ApiKeyModel from './ApiKeyModel';

export default class ApiKeyDetails extends AbstractModel {
  static get schema() {
    return {
      apiKey: Joi.object().instance(ApiKeyModel).required(),
      hash: Joi.string().required(),
      signature: Joi.string().required(),
      relaySignature: Joi.string().required(),
    };
  }
  constructor(data, options) {
    super(data, options);
    Object.freeze(this);
  }

  get key() {
    return this.hash;
  }
  static fromJson(data) {
    return new ApiKeyDetails(
      {
        ...data,
        apiKey: ApiKeyModel.fromJson(data.apiKey),
      },
      {stripUnknown: true},
    );
  }
}
