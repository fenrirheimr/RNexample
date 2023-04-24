import React from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {connect} from 'react-redux';
import uuid from 'react-native-uuid';
import {loadWallets} from 'src/store/actions/wallets';
import {
  loadApiKeys,
  removeApiKey,
  updateApiKey,
  createApiKey,
} from 'src/store/actions/credentials';

import {TxButton, TxWarningComponent, TxSwitch} from 'src/components/index';
import {HeaderSmall} from 'src/partials/index';

import styles from './ApiKeysPage.scss';
import {Copy, Delete} from 'src/assets/svg/index';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-simple-toast';

function mapDispatchToProps(dispatch) {
  return {
    loadWallets: () => dispatch(loadWallets()),
    loadApiKeys: account => dispatch(loadApiKeys(account)),
    removeApiKey: (id, hash) => dispatch(removeApiKey(id, hash)),
    updateApiKey: (id, account, request, hash) =>
      dispatch(updateApiKey(id, account, request, hash)),
    createApiKey: (id, account) => dispatch(createApiKey(id, account)),
  };
}
function mapStateToProps(state) {
  return {
    activeEntry: state?.walletsReducer.activeEntry,
    apiKeys: state?.credentialsReducer.apiKeys,
  };
}

class ApiKeysPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      refreshing: false,
      isBusy: false,
      isBusyRemove: null,
      apiKeyOperationError: '',
      profileLoading: false,
      isReloadBusy: false,
      isBusyTwoFa: false,
      apiKeys: this.props.apiKeys || [],
    };
  }
  componentDidMount = async () => {
    await this.load();
  };
  onRefresh = async () => {
    this.setState({refreshing: true});
    await this.load();
    this.setState({refreshing: false});
  };
  async load() {
    this.setState({loading: true});
    await Promise.all([this.props.loadWallets()]);
    let account = this.props.activeEntry.address;
    try {
      await this.props.loadApiKeys(account);
    } catch (e) {
      console.log('e', e);
    } finally {
      this.setState({loading: false, apiKeys: this.props.apiKeys});
    }
  }
  handleCopy(text) {
    Clipboard.setString(text);
    Toast.show('Copied!');
  }
  async handleRemove(hash) {
    let account = this.props.activeEntry.address;
    let id = this.props.activeEntry.id;
    this.setState({isBusyRemove: hash, apiKeyOperationError: ''});
    try {
      await this.props.removeApiKey(id, hash);
    } catch (e) {
      this.apiKeyOperationError = 'Unknown error';
    } finally {
      await this.props.loadApiKeys(account);
      this.setState({isBusyRemove: null, apiKeys: this.props.apiKeys});
    }
  }
  async handleSwitchPermission(value, item, fieldName) {
    this.setState({isBusy: true});
    let account = this.props.activeEntry.address;
    let id = this.props.activeEntry.id;
    const request = {
      account: account,
      active: item.apiKey.active,
      generalOperationAvailable: item.apiKey.generalOperationAvailable,
      tradeAvailable: item.apiKey.tradeAvailable,
      withdrawAvailable: item.apiKey.withdrawAvailable,
      [fieldName]: value,
    };
    setImmediate(async () => {
      try {
        await this.props.updateApiKey(id, account, request, item.hash);
      } catch (e) {
        this.apiKeyOperationError = 'Unknown error';
      } finally {
        await this.props.loadApiKeys(account);
        this.setState({
          isBusy: false,
          apiKeys: this.props.apiKeys,
        });
      }
    });
  }
  async handleCreate() {
    let account = this.props.activeEntry.address;
    let id = this.props.activeEntry.id;
    this.setState({
      isBusy: true,
      isBusyCreation: true,
      apiKeyOperationError: '',
    });
    setImmediate(async () => {
      try {
        await this.props.createApiKey(id, account);
      } catch (e) {
        this.apiKeyOperationError = 'Unknown error';
      } finally {
        this.setState({
          isBusy: false,
          isBusyCreation: false,
          apiKeys: this.props.apiKeys,
        });
      }
    });
  }
  headerData() {
    return {
      title: 'API keys',
      navigation: this.props.navigation,
      route: this.props.route,
    };
  }
  render() {
    return (
      <View style={styles.wrapper}>
        <HeaderSmall data={this.headerData()} />
        <ScrollView
          nestedScrollEnabled={true}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="always"
          contentInsetAdjustmentBehavior="automatic"
          scrollEnabled={true}
          style={[
            styles.key_wrapper,
            this.state.loading ? styles.loading : null,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={() => this.onRefresh()}
            />
          }>
          {!this.state.loading ? (
            <>
              {this.state.apiKeys.map(item => (
                <>
                  <View
                    pointerEvents={
                      (this.state.isBusy || this.state.isBusyRemove) ===
                      item.hash
                        ? 'none'
                        : 'auto'
                    }
                    key={uuid.v4()}
                    style={[
                      styles.key_block,
                      this.state.isBusyRemove === item.hash
                        ? styles.key_block_deleted
                        : null,
                    ]}>
                    <View style={styles.key_row}>
                      <View style={styles.first_column}>
                        <View style={styles.content_wrapper}>
                          <Text style={styles.title}>KEY ID</Text>
                          <TouchableOpacity
                            style={styles.copy}
                            onPress={() => this.handleCopy(item.apiKey.key)}>
                            <Text style={styles.content}>
                              {item.apiKey.key}
                            </Text>
                            <Copy style={styles.icon} />
                          </TouchableOpacity>
                        </View>
                        <View style={styles.content_wrapper}>
                          <Text style={styles.title}>KEY SECRET</Text>
                          <TouchableOpacity
                            style={styles.copy}
                            onPress={() => this.handleCopy(item.apiKey.secret)}>
                            <Text style={styles.content}>
                              {item.apiKey.secret}
                            </Text>
                            <Copy style={styles.icon} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.second_column}>
                        <TouchableOpacity
                          disabled={this.state.isBusy}
                          style={[
                            styles.copy,
                            this.state.isBusy ? styles.disable : null,
                          ]}
                          onPress={() => this.handleRemove(item.hash)}>
                          <Delete style={styles.icon} width={20} height={20} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.switchers_wrapper}>
                      <View style={styles.switcher_block}>
                        <Text style={[styles.switcher_title, styles.ml10]}>
                          Active
                        </Text>
                        <TxSwitch
                          disabled={this.state.isBusy}
                          isBusy={this.state.isBusy}
                          value={item.apiKey.active}
                          onValueChange={() =>
                            this.handleSwitchPermission(
                              !item.apiKey.active,
                              item,
                              'active',
                            )
                          }
                        />
                      </View>
                      {item.apiKey.active ? (
                        <>
                          <View style={styles.switcher_block}>
                            <Text style={[styles.switcher_title, styles.ml10]}>
                              General
                            </Text>
                            <TxSwitch
                              disabled={this.state.isBusy}
                              isBusy={this.state.isBusy}
                              value={item.apiKey.generalOperationAvailable}
                              onValueChange={() =>
                                this.handleSwitchPermission(
                                  !item.apiKey.generalOperationAvailable,
                                  item,
                                  'generalOperationAvailable',
                                )
                              }
                            />
                          </View>
                          <View style={styles.switcher_block}>
                            <Text style={[styles.switcher_title, styles.ml10]}>
                              Trading
                            </Text>
                            <TxSwitch
                              disabled={this.state.isBusy}
                              isBusy={this.state.isBusy}
                              value={item.apiKey.tradeAvailable}
                              onValueChange={() =>
                                this.handleSwitchPermission(
                                  !item.apiKey.tradeAvailable,
                                  item,
                                  'tradeAvailable',
                                )
                              }
                            />
                          </View>
                          <View style={styles.switcher_block}>
                            <Text style={[styles.switcher_title, styles.ml10]}>
                              Withdrawals
                            </Text>
                            <TxSwitch
                              disabled={this.state.isBusy}
                              isBusy={this.state.isBusy}
                              value={item.apiKey.withdrawAvailable}
                              onValueChange={() =>
                                this.handleSwitchPermission(
                                  !item.apiKey.withdrawAvailable,
                                  item,
                                  'withdrawAvailable',
                                )
                              }
                            />
                          </View>
                        </>
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.divider} />
                </>
              ))}
              <View style={styles.button_wrapper}>
                {!this.state.loading && !this.props.apiKeys.length ? (
                  <TxWarningComponent
                    style={styles.warning}
                    mode="hand"
                    text="You don’t have API keys yet"
                  />
                ) : null}
                <TxButton
                  title="Create new api key"
                  disabled={this.state.isBusy}
                  loading={this.state.isBusyCreation}
                  uppercase
                  mode={'clear'}
                  onPress={() => this.handleCreate()}
                />
              </View>
            </>
          ) : (
            <ActivityIndicator
              size="large"
              color="#000"
              style={styles.spinner}
            />
          )}
        </ScrollView>
      </View>
    );
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(ApiKeysPage);
