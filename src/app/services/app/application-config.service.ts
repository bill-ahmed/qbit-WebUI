import { Injectable } from '@angular/core';
import * as _appConfig from '../../app.config.json';
import { QbittorrentBuildInfo, UserPreferences, WebUISettings, DownloadSettings } from 'src/utils/Interfaces';
import { TorrentDataStoreService } from '../torrent-management/torrent-data-store.service';

// Utils
import * as http_endpoints from '../../../assets/http_config.json';
import * as config from '../../../assets/config.json';
import { IsDevEnv } from 'src/utils/Environment';
import { HttpClient } from '@angular/common/http';
import { ApplicationDefaults } from './defaults';
import { NetworkConnectionInformationService } from '../network/network-connection-information.service';
import { MergeDeep } from 'src/utils/Helpers';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApplicationConfigService {

  static THEME_OPTIONS = ['Light', 'Dark'];
  static TORRENT_TABLE_COLUMNS: TORRENT_TABLE_COLUMNS[] = [
    'Name', 'Size', 'Progress', 'Status',
    'Down Speed', 'Up Speed', 'ETA',
    'Ratio', 'Uploaded',
    'Completed On', 'Added On', 'Last Activity'
  ];

  /** All available columns for the torrent table */
  static ALL_COLUMNS = ['select', 'Actions', ...ApplicationConfigService.TORRENT_TABLE_COLUMNS];

  private user_preferences: UserPreferences;
  private user_preference_obs = new BehaviorSubject<any>({ });

  private application_version: string;
  private qBitBuildInfo: QbittorrentBuildInfo;
  private loaded_preferences = false;

  constructor(private data_store: TorrentDataStoreService, private networkInfo: NetworkConnectionInformationService, private http: HttpClient) {

    this.application_version = _appConfig.version;
    this.data_store.GetApplicationBuildInfo()
    .then(res => { this.qBitBuildInfo = res })
    .catch(err => { console.log("Error getting build info", err); this.qBitBuildInfo = { appVersion: 'N/A', apiVersion: 'N/A' } });

    this.user_preferences = { } as UserPreferences;
    this.user_preferences.web_ui_options = JSON.parse(localStorage.getItem('web_ui_options')) || { } as WebUISettings;
    this.updateUserPreferences();
  }

  /** If dark theme is enabled, then disable it in preferences. */
  setDarkThemeEnabled(val: boolean) {
    this.user_preferences.web_ui_options.dark_mode_enabled = val;
    this._persistWebUIOptions()
  }

  /** Update which columns are chosen to be shown, as well as their order */
  setTorrentTableColumns(cols: string[]) {
    this.user_preferences.web_ui_options.torrent_table.columns_to_show = cols;
    this._persistWebUIOptions();
  }

  async getQbittorrentBuildInfo(): Promise<QbittorrentBuildInfo> {
    if(!this.qBitBuildInfo) { this.qBitBuildInfo = await this.data_store.GetApplicationBuildInfo(); }

    return this.qBitBuildInfo;
  }

  async getUserPreferences(): Promise<UserPreferences> {
    if(!this.user_preferences || !this.loaded_preferences) {
      await this.updateUserPreferences();
      this.loaded_preferences = true;
    }
    return this.user_preferences;
  }

  getUserPreferencesSubscription() {
    return this.user_preference_obs
  }

  getApplicationVersion(): string {
    return this.application_version;
  }

  /** A string in the format 'v1.2.3' */
  getApplicationVersionString(): string {
    return `v${this.getApplicationVersion()}`;
  }

  getWebUISettings(): WebUISettings {
    return this.user_preferences.web_ui_options;
  }

  getFileSystemDelimiter(): string | null {
    let fs_opts = this.user_preferences.web_ui_options?.file_system
    return fs_opts?.use_alt_delimiter ? fs_opts.delimiter : config.filePathDelimeter;
  }

  setWebUIOptions(opt: WebUISettings) {
    this.user_preferences.web_ui_options = opt;
    this._persistWebUIOptions();
  }

  /** Persist download options.
   * Makes a network request.
   */
  async setUserPreferences(opt: UserPreferences): Promise<void> {
    await this.data_store.SetUserPreferences(opt).toPromise();
  }

  async getDarkThemePref(): Promise<boolean> {
    if(!this.user_preferences) {
      await this.getUserPreferences();
    }

    return this.user_preferences.web_ui_options.dark_mode_enabled;
  }

  /** Erase all user settings for Web UI options,
   * and replace with application defaults.
   *
   * NOTE: YOU CANNOT UNDO THIS ACTION
   */
  resetAllWebUISettings() {
    this.setWebUIOptions(ApplicationDefaults.DEFAULT_WEB_UI_SETTINGS);
  }

  /** Various helper methods **/

  canViewSnackbarNotification(): boolean {
    return !!this.user_preferences.web_ui_options.notifications?.show_snack_notifications;
  }

  private async updateUserPreferences() {
    let root = http_endpoints.endpoints.root;
    let endpoint = http_endpoints.endpoints.userPreferences;
    let url = root + endpoint;

    // Do not send cookies in dev mode
    let options = IsDevEnv() ? { } : { withCredentials: true }

    // Deep merge the properties using lodash
    let existing_preferences = this.user_preferences?.web_ui_options || JSON.parse(localStorage.getItem('web_ui_options'))

    /** Deep copy! User preferences are pretty small, so we can do this fairly efficiently */
    let default_preferences = JSON.parse(JSON.stringify(ApplicationDefaults.DEFAULT_WEB_UI_SETTINGS))

    /** Do a deep merge, such that existing_preferences take precedence.
     * However, if a particular preference doens't exist, then the default
     * takes over. This should help prevent breaking changes between
     * different Web UI versions as they become available.
     */
    let web_ui_options = MergeDeep({ ...default_preferences }, existing_preferences)

    this.user_preferences = await this.http.get(url, options).toPromise() as UserPreferences;
    this.user_preferences.web_ui_options = web_ui_options || { } as WebUISettings;

    this._persistQbitorrentPreferences(false);
    this._persistWebUIOptions(false);

    // Network-related settings
    if(!this.user_preferences.web_ui_options.network?.auto_refresh) {
      this.networkInfo.disableAutoMode();
      this.networkInfo.setRefreshInterval(this.user_preferences.web_ui_options?.network?.refresh_interval || NetworkConnectionInformationService.DEFAULT_REFRESH_INTERVAL);
    }

    this.loaded_preferences = true;
    this._updateSubscription();
  }

  private async _persistWebUIOptions(update_sub?: boolean) {
    localStorage.setItem('web_ui_options', JSON.stringify(this.user_preferences.web_ui_options));
    if(update_sub) { this._updateSubscription(); }
  }

  private async _persistQbitorrentPreferences(update_sub?: boolean) {
    localStorage.setItem('preferences', JSON.stringify({...this.user_preferences, web_ui_options: null}));
    if(update_sub) { this._updateSubscription(); }
  }

  /** Trigger user preferences observable */
  private _updateSubscription() {
    this.user_preference_obs.next(this.user_preferences);
  }
}

export type TORRENT_TABLE_COLUMNS = 'Name' | 'Size' | 'Progress' | 'Status' | 'Down Speed' | 'Up Speed' | 'ETA' | 'Ratio' | 'Uploaded' | 'Completed On' | 'Added On' | any;
export type TORRENT_TABLE_COLUMNS_RAW = 'select' | 'Actions' | 'Name' | 'Size' | 'Progress' | 'Status' | 'Down_Speed' | 'Up_Speed' | 'ETA' | 'Ratio' | 'Uploaded' | 'Completed_On' | any;
