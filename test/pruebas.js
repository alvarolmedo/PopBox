var http = require('http');



var enProceso = 0,
    hechas = 0,
    errores = 0,
    HOST_PROV = 'relayA',
    HOST_SRV = 'relayA',
    PORT = 3001,
    EXPIRATION_DELAY = 86400,
    PAYLOAD = new Array(1024).join('*'),
    superProv = {};

(function() {
  'use strict';
  var queue;

  superProv.payload = new Array(1024).join('*');
  superProv.queue = [];

  for (var i = 0; i < 20000; i++) {
    queue = '0123456789012';
    superProv.queue.push({id: queue});
  }
  superProv.priority = 'H';
  superProv.expirationDelay = EXPIRATION_DELAY;
  superProv.callback = null;

}());

http.globalAgent.maxSockets = 20000;

//pesadito(2000);
superProvision();

function pesadito(num) {
  'use strict';

  console.time('pesadito');

  for (var i = 0; i < num; i += 1) {
    doPop('q' + i, 1, printStats);
  }

  function printStats() {
    console.log('en_proceso %d, hechas %d, errores %d', enProceso, hechas,
        errores);
    if (enProceso === 0) {
      console.timeEnd('pesadito');
    }
  }
}

function superProvision() {
  'use strict';

  console.log(superProv);

  console.time('superProvision');

  doSuperPush(function() {
    console.timeEnd('superProvision');
  });


}


function doPop(queue, timeout, cb) {
  'use strict';
  var options = { host: HOST_SRV, port: PORT, path: '/queue/' + queue + '?timeout=' + timeout, method: 'GET'};
  postObj(options, '', cb);
}

function doPush(queue, message, cb) {
  'use strict';
  var options = { host: HOST_PROV, port: PORT, path: '/trans'};
  var trans = { 'callback': 'http://localhost:8888/',
    payload: PAYLOAD, priority: 'H',
    'queue': [
        {'id': queue}
      ], 'expirationDelay': EXPIRATION_DELAY };

  postObj(options, trans, cb);
}

function doSuperPush(cb) {
  'use strict';
  var options = { host: HOST_PROV, port: PORT, path: '/trans'};

  postObj(options, superProv, cb);
}

function postObj(options, content, cb) {
  'use strict';

  var data = '';
  options = options || {};
  options.host = options.host || 'relayA';
  options.method = options.method || 'POST';
  options.headers = options.headers || {};

  options.headers['content-type'] = 'application/json';


  var req = http.request(options, function(res) {

    var o; //returned object from request
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
      data += chunk;
      console.log('data ' + data);
    });
    res.on('end', function() {

      console.log('end ' + data);
      enProceso--;
      hechas++;
      cb();
    });
  });

  req.on('error', function(e) {
    console.log(e);
    errores++;
    enProceso--;
    cb();
  });

  if (content !== null) {
    // write data to request body
    req.write(JSON.stringify(content));
  }
  req.end();

  enProceso++;
}


