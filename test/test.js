var should = require('should');
var sinon = require('sinon');
var pcsc = require('../lib/pcsclite');

describe('Testing PCSCLite private', function() {

    describe('#start()', function() {
        it('#start() stub', function(done) {
            var p = pcsc();
            var stub = sinon.stub(p, 'start');

            stub.callsFake(function(my_cb) {
                my_cb(undefined, Buffer.from("MyReader\0\0"));
                my_cb(undefined, Buffer.from("MyReader"));
                my_cb(undefined, Buffer.from("MyReader1\0MyReader2\0\0"));
            });

            var times = 0;
            p.on('reader', function(reader) {
                switch (++times) {
                    case 1:
                        reader.name.should.equal("MyReader");
                        break;
                    case 2:
                        reader.name.should.equal("MyReader1");
                        break;
                    case 3:
                        reader.name.should.equal("MyReader2");
                        p.close();
                        done();
                        break;
                }
            });
        });
    });
});


describe('Testing CardReader private', function() {

    var get_reader = function() {
        var p = pcsc();
        var stub = sinon.stub(p, 'start').callsFake(function(my_cb) {
            /* "MyReader\0" */
            my_cb(undefined, Buffer.from("MyReader\0\0"));
        });

        return p;
    };

    describe('#_connect()', function() {

        it('#_connect() success', function(done) {
            var p = get_reader();
            p.on('reader', function(reader) {
                var connect_stub = sinon.stub(reader, '_connect').callsFake(function(share_mode,
                                                                           protocol,
                                                                           connect_cb) {
                    connect_cb(undefined, 1);
                });

                reader.connect(function(err, protocol) {
                    should.not.exist(err);
                    protocol.should.equal(1);
                    done();
                });
            });
        });

        it('#_connect() error', function() {
            var p = get_reader();
            p.on('reader', function(reader) {
                var cb = sinon.spy();
                var connect_stub = sinon.stub(reader, '_connect').callsFake(function(share_mode,
                                                                           protocol,
                                                                           connect_cb) {
                    connect_cb("");
                });

                reader.connect(cb);
                sinon.assert.calledOnce(cb);
            });
        });

        it('#_connect() already connected', function() {
            var p = get_reader();
            p.on('reader', function(reader) {
                var cb = sinon.spy();
                reader.connected = true;

                reader.connect(cb);
                process.nextTick(function () {
                    sinon.assert.calledOnce(cb);
                });
            });
        });
    });

    describe('#_disconnect()', function() {

        it('#_disconnect() success', function() {
            var p = get_reader();
            p.on('reader', function(reader) {
                reader.connected = true;
                var cb = sinon.spy();
                var connect_stub = sinon.stub(reader, '_disconnect').callsFake(function(disposition,
                                                                              disconnect_cb) {
                    disconnect_cb(undefined);
                });

                reader.disconnect(cb);
                sinon.assert.calledOnce(cb);
            });
        });

        it('#_disconnect() error', function() {
            var p = get_reader();
            p.on('reader', function(reader) {
                reader.connected = true;
                var cb = sinon.spy();
                var connect_stub = sinon.stub(reader, '_disconnect').callsFake(function(disposition,
                                                                              disconnect_cb) {
                    disconnect_cb("");
                });

                reader.disconnect(cb);
                sinon.assert.calledOnce(cb);
            });
        });

        it('#_disconnect() already disconnected', function() {
            var p = get_reader();
            p.on('reader', function(reader) {
                var cb = sinon.spy();
                var connect_stub = sinon.stub(reader, '_disconnect').callsFake(function(disposition,
                                                                              disconnect_cb) {
                    disconnect_cb(undefined);
                });

                reader.disconnect(cb);
                process.nextTick(function () {
                    sinon.assert.calledOnce(cb);
                });
            });
        });
    });
});
