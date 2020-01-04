"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const proxy = require("express-http-proxy");
function serveProxy(app) {
    Object.values(rbxAPIs).forEach(url => {
        let subdomain = (url.match(/https:\/\/(\w+?)\./) || [])[1];
        if (subdomain) {
            app.use(`/proxy/${subdomain}`, proxy(url));
        }
    });
}
exports.serveProxy = serveProxy;
const rbxAPIs = {
    abtestingApiSite: "https://abtesting.roblox.com",
    accountInformationApi: "https://accountinformation.roblox.com",
    accountSettingsApi: "https://accountsettings.roblox.com",
    apiGatewayUrl: "https://apis.roblox.com",
    apiProxyUrl: "https://api.roblox.com",
    assetDeliveryApi: "https://assetdelivery.roblox.com",
    authApi: "https://auth.roblox.com",
    authAppSite: "https://authsite.roblox.com",
    avatarApi: "https://avatar.roblox.com",
    badgesApi: "https://badges.roblox.com",
    billingApi: "https://billing.roblox.com",
    captchaApi: "https://captcha.roblox.com",
    catalogApi: "https://catalog.roblox.com",
    chatApi: "https://chat.roblox.com",
    contactsApi: "https://contacts.roblox.com",
    developApi: "https://develop.roblox.com",
    economyApi: "https://economy.roblox.com",
    engagementPayoutsApi: "https://engagementpayouts.roblox.com",
    followingsApi: "https://followings.roblox.com",
    friendsApi: "https://friends.roblox.com",
    friendsAppSite: "https://friendsite.roblox.com",
    gamesApi: "https://games.roblox.com",
    gameInternationalizationApi: "https://gameinternationalization.roblox.com",
    groupsApi: "https://groups.roblox.com",
    inventoryApi: "https://inventory.roblox.com",
    itemConfigurationApi: "https://itemconfiguration.roblox.com",
    localeApi: "https://locale.roblox.com",
    localizationTablesApi: "https://localizationtables.roblox.com",
    metricsApi: "https://metrics.roblox.com",
    midasApi: "https://midas.roblox.com",
    notificationApi: "https://notifications.roblox.com",
    premiumFeaturesApi: "https://premiumfeatures.roblox.com",
    presenceApi: "https://presence.roblox.com",
    publishApi: "https://publish.roblox.com",
    screenTimeApi: "https://apis.rcs.roblox.com/screen-time-api",
    thumbnailsApi: "https://thumbnails.roblox.com",
    tradesApi: "https://trades.roblox.com",
    translationRolesApi: "https://translationroles.roblox.com",
    universalAppConfigurationApi: "https://apis.roblox.com/universal-app-configuration",
    usersApi: "https://users.roblox.com",
    voiceApi: "https://voice.roblox.com",
    websiteUrl: "https://www.roblox.com",
    privateMessagesApi: "https://notifications.roblox.com"
};
//# sourceMappingURL=proxy.js.map