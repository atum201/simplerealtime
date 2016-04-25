var DatabaseConfig = {
    host: 'localhost',
    port: 27017,
    database: '',
	user:'',
	pwd:'',
    getConnectionString: function() {
        return 'mongodb://'+this.user+':'+this.pwd+'@' + this.host + ':' + this.port + '/' + this.database;
    }
};

module.exports = DatabaseConfig;
