var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();

module.exports = function(app){
/**
 * @api {get} channels Get Channels
 * @apiName getAll
 * @apiGroup channel
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *   {
 *      "channels": [
 *
 *      ]
 *  }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 200 Not Found
 *     {
 *       "error": {
 *          "message": "",
 *           "error": ""
 *       }
 *     }
 */
app.get('/api/channels', function(req, res) {
  res.send([]);
});
/**
 * @api {post} /api/channels/:channel/boss/status Update Boss Channel Status
 * @apiName updateBossStatus
 * @apiGroup channel
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *   {
 *      "response": {
 *
 *      }
 *  }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 200 Not Found
 *     {
 *       "error": {
 *          "message": "",
 *           "error": ""
 *       }
 *     }
 */
app.post('/api/channels/:channel/boss/status', function(req, res) {
  res.send({});
});

}
