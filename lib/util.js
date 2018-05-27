
'use strict';

/**
 * Normalize a port into a number, string, or false.
 *
 * @param {Object} val to process
 * @return {int|boolean} normalizes the port
 */
module.exports.normalizePort = function(val) {
    let port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
};

/**
   * Event listener for HTTP server "error" event.
   */



