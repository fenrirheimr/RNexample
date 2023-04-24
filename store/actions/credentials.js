import {withAccessToken, withoutAccessToken, signData} from 'src/remotes.js';
import ApiKeyDetails from 'src/models/core/ApiKeyDetails';
import UpdateApiKeyRequest from 'src/models/domain/UpdateApiKeyRequest';

import {PLASMA_SERVICE_ENDPOINT_BASE_URL} from '@env';
export const LOAD_API_KEYS = 'LOAD_API_KEYS';
export const CREATE_API_KEYS = 'CREATE_API_KEYS';

export const loadApiKeys = (account, code) => {
  return async dispatch => {
    const baseUrl = PLASMA_SERVICE_ENDPOINT_BASE_URL;
    let apiKeys = [];
    let response = null;
    if (account) {
      try {
        response = await withAccessToken(
          baseUrl,
          'custody/credentials',
          'get',
          {
            params: {
              owner: account,
            },
            code: code,
          },
          true,
        );
      } catch (e) {
        console.log('Load Api Keys error', e);
      }
      if (response) {
        apiKeys = response.data;
        dispatch({
          type: LOAD_API_KEYS,
          payload: apiKeys.map(ApiKeyDetails.fromJson),
        });
      }
    }
  };
};
export const removeApiKey = (id, hash) => {
  return async dispatch => {
    const baseUrl = PLASMA_SERVICE_ENDPOINT_BASE_URL;

    const keyData = await withoutAccessToken(
      baseUrl,
      `/key/delete/h/${hash}`,
      'get',
    );

    const deleteHash = keyData.data.deleteHash;
    const deleteApiKey = keyData.data.deleteApiKey;

    const signature = await signData(id, deleteHash, {
      root: true,
    });

    try {
      await withoutAccessToken(baseUrl, '/key/delete/h', 'post', {
        deleteApiKey: deleteApiKey,
        principalSignature: signature.signature,
      });
    } catch (e) {
      console.log('Remove Api Key error', e);
    }
  };
};
export const updateApiKey = (id, account, request, hash) => {
  return async dispatch => {
    const baseUrl = PLASMA_SERVICE_ENDPOINT_BASE_URL;
    const data = new UpdateApiKeyRequest(request);

    const keyData = await withoutAccessToken(
      baseUrl,
      `/key/h/${hash}/update/prepare`,
      'post',
      data,
    );

    const hashToSign = keyData.data.hash;

    const {signature} = await signData(id, hashToSign, {
      root: true,
    });

    try {
      await withoutAccessToken(
        baseUrl,
        `/key/h/${hash}/update/perform`,
        'post',
        {
          updateRequest: data,
          signature,
          principal: account,
        },
      );
    } catch (e) {
      console.log('Update Api Key error', e);
    }
  };
};
export const createApiKey = (id, account) => {
  return async dispatch => {
    const baseUrl = PLASMA_SERVICE_ENDPOINT_BASE_URL;

    const keyData = await withoutAccessToken(baseUrl, 'key/prepare', 'post', {
      principal: account,
    });

    const apiKey = keyData.data.apiKey;
    const apiKeyHash = keyData.data.apiKeyHash;

    const {signature} = await signData(id, apiKeyHash, {
      root: true,
    });

    await withoutAccessToken(baseUrl, 'key/perform', 'post', {
      apiKey,
      principalSignature: signature,
    });

    let apiKeys = [];
    let response = null;

    try {
      response = await withAccessToken(
        baseUrl,
        `custody/credentials/h/${apiKeyHash}`,
        'get',
        true,
      );
    } catch (e) {
      console.log('Create Api Keys error', e);
    }

    if (response) {
      apiKeys = [response.data];
      dispatch({
        type: CREATE_API_KEYS,
        payload: apiKeys.map(ApiKeyDetails.fromJson),
      });
    }
  };
};
