namespace main{
    export function main() {
        let 服务器配置文件路径 = 'dist/config.json'
        fs.readFile(服务器配置文件路径, 'utf8', function (异常, JSON数据) {
            if (异常) {
                console.error("无法打开配置文件:", 异常.path);
            } else {
                服务器配置加载完成(JSON.parse(JSON数据))
            }
        })
    }

    function getWorldDistribution(worlds:any){
        var distribution = [];
            
        _.each(worlds, function(world) {
            distribution.push(world.playerCount);
        });
        return distribution
    }

    function 服务器配置加载完成(服务器配置:配置){
        let 服务器 = new socketIO服务器(服务器配置.host,服务器配置.port)

        let worlds = []
        let lastTotalPlayers = 0

        服务器.监听连接(function(connection) {
            var world, // the one in which the player will be spawned
                connect = function() {
                    if(world) {
                        world.connect_callback(new Player(connection, world));
                    }
                };
            
            // simply fill each world sequentially until they are full
            world = _.detect(worlds, function(world) {
                return world.playerCount < 服务器配置.nb_players_per_world;
            });
            world.updatePopulation();
            connect();
        });
    
        服务器.onError(function() {
            console.error(Array.prototype.join.call(arguments, ", "));
        });
        
    
        _.each(_.range(服务器配置.nb_worlds), function(i) {
            var world = new 世界服务器('world'+ (i+1), 服务器配置.nb_players_per_world, 服务器);
            world.run(服务器配置.map_filepath);
            worlds.push(world);
            
        });
        
        服务器.onRequestStatus(function() {
            return JSON.stringify(getWorldDistribution(worlds));
        });
        
        
        process.on('uncaughtException', function (e:any) {
            console.error('uncaughtException: ' + e);
        });
    }
}

//将main命名空间引用置于exports上
var exports:any;
exports.main = main;