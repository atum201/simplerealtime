var DatabaseConfig = {
    host: '203.162.121.204',
    port: 27017,
    database: 'hpn',
	user:'adminhpn',
	pwd:'CNTT1234',
    getConnectionString: function() {
        return 'mongodb://'+this.user+':'+this.pwd+'@' + this.host + ':' + this.port + '/' + this.database;
    }
};

module.exports = DatabaseConfig;