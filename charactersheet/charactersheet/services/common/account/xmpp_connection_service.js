'use strict';
/*eslint no-console:0*/

/**
 * The default configuration object. Use this as a template for creating
 * custom configurations.
 */
var XMPPServiceDefaultConfig = {
    url: 'ws://localhost:5050/websocket/',

    connection: {
        // Specify a custom callback here.
        callback: null
    },

    credentialsHelper: function() {
        var bareJID = UserServiceManager.sharedService().user().xmpp.jid;
        var resource = 'Adventurers Codex (Web)';
        var token = PersistenceService.findAll(AuthenticationToken)[0];
        return {
            jid: bareJID + '/' + resource,
            password: token.accessToken()
        };
    },

    //Options: throw, log, none
    fallbackAction: 'log'
};


/**
 * A global connection manager service.
 *
 * A single, shared connection to the XMPP server is shared across
 * the application instance, and can be accessed via `sharedConnection`.
 */
var XMPPService = new SharedServiceManager(_XMPPService, XMPPServiceDefaultConfig);


function _XMPPService(config) {
    var self = this;

    /**
     * Custom configurations for a connection should be provided before
     * the connection is established.
     */
    self.configuration = config;

    self.connection = null;

    self._isShuttingDown = false;
    self._connectionRetries = 0;
    self.MAX_RETRIES = 5;
    self.MIN_RETRY_INTERVAL = 1500;

    /**
     * A lazily instantiated connection to the XMPP backend server.
     * The first attempt to fetch this connection will instantiate
     * and attempt to connect the user to the given XMPP backend.
     * This means that the first call to this property will take time
     * as connections are established.
     *
     * If a connection fails, the fallback action is determined by the
     * configuration settings for the service.
     */
    self.init = function() {
        // Namespace config
        Strophe.addNamespace('HTML', 'http://jabber.org/protocol/xhtml-im');
        Strophe.addNamespace('BODY', 'http://www.w3.org/1999/xhtml');

        Strophe.addNamespace('PUBSUB', 'http://jabber.org/protocol/pubsub');
        Strophe.addNamespace('JSON', 'urn:xmpp:json:0');
        Strophe.addNamespace('ACTIVE', 'http://jabber.org/protocol/chatstates');

        Strophe.addNamespace('ATOM', 'http://www.w3.org/2005/Atom');
        Strophe.addNamespace('DELAY', 'urn:xmpp:delay');
        Strophe.addNamespace('RSM', 'http://jabber.org/protocol/rsm');

        self._initializeConnection();

        Notifications.characterManager.changed.addOnce(self._handleConnect);
    };

    self.deinit = function() {
        self._isShuttingDown = true;
        self.connection.disconnect();
    };

    /* Private Methods */

    self._initializeConnection = function() {
        var connection = new Strophe.Connection(self.configuration.url);
        var callback = self.configuration.connection.callback || self._connectionHandler;
        self.connection = connection;

        Notifications.xmpp.initialized.dispatch();
    };

    self._shouldLog = function() {
        return self.configuration.fallbackAction == 'log';
    };

    self._shouldThrow = function() {
        return self.configuration.fallbackAction == 'throw';
    };

    self._handleConnect = function() {
        // Don't connect to XMPP without a logged in user.
        var user = UserServiceManager.sharedService().user();
        if (!user) { return; }

        self._isShuttingDown = false;
        var credentials = self.configuration.credentialsHelper();
        var callback = self.configuration.connection.callback || self._connectionHandler;

        self.connection.connect(credentials.jid, credentials.password, callback);
        self.connection.flush();
    };

    self._connectionHandler = function(status, error) {
        if (error) {
            if (self._shouldLog()) {
                if ('console' in window) {
                    console.log(error);
                }
            } else if (self._shouldThrow()) {
                throw error;
            }
        }
        if (status === Strophe.Status.CONNECTED || status === Strophe.Status.ATTACHED) {
            self._connectionRetries = 0;
            if (self._shouldLog() && 'console' in window) {
                console.log('Connected.');
            }

            // Send initial presence.
            // https://xmpp.org/rfcs/rfc3921.html#presence
            self.connection.send($pres().tree());
            self.connection.flush();

            Notifications.xmpp.connected.dispatch();
        } else if (status === Strophe.Status.DISCONNECTED) {
            // Typical disconnect workflow.
            if (self._shouldLog() && 'console' in window) {
                console.log('Disconnected.');
            }
            Notifications.xmpp.disconnected.dispatch(true);

            // Attempt reconnect, unless the app is shutting down.
            if (!self._isShuttingDown) {
                self._attemptRetry(true);
            }
        } else if (status === Strophe.Status.CONNECTING) {
            if (self._shouldLog() && 'console' in window) {
                console.log('Connecting.');
            }
        } else if (status === Strophe.Status.AUTHFAIL) {
            Notifications.xmpp.error.dispatch(status);
            if (self._shouldLog() && 'console' in window) {
                console.log('Authentication failure.');
            }
        } else {
            Notifications.xmpp.error.dispatch(status);
            if (self._shouldLog() && 'console' in window) {
                console.log('Strophe.Status: ', status);
            }
        }

        // Add more logging...
    };

    /**
     * Using an internal refresh count, attempt to reestablish the connection
     * if possible.
     *
     * This method uses a progressive back-off algorithm to try and
     * re-establish connectivity. The first half of the requests are made
     * frequently with later requests happening later and later.
     */
    self._attemptRetry = function(forceReconnect) {
        if (!forceReconnect && self.connection.connected) {
            console.log('Already connected, retry not forced. Skipping...')
            return;
        }

        if (self._connectionRetries >= self.MAX_RETRIES) {
            console.log('No attempt to reconnect: max connection retries reached.');
            return;
        }

        console.log('Attempting to reconnect. Attempt {count}..'.replace('{count}', self._connectionRetries));
        self._connectionRetries += 1;

        // Give the rest of the app the ability to unsubscribe before retrying.
        Notifications.xmpp.disconnected.dispatch();
        self._initializeConnection();
        self._handleConnect();

        var interval = self._connectionRetries * self.MIN_RETRY_INTERVAL;
        setTimeout(self._attemptRetry, interval);
    };
}
