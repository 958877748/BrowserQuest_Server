/**
 * 抽象服务器和连接类
 */
class Server {
    private _connections: any = {}
    protected _counter: number = 0
    
    error_callback: any
    /**
     * 端口号
     */
    public port: number
    constructor(port: number) {
        this.port = port
    }


    protected 连接回调函数: (新连接: socketIOConnection) => void
    /** 当有客户端连接上服务器时调用 */
    public 监听连接(回调函数: (新连接: socketIOConnection) => void) {
        this.连接回调函数 = 回调函数
    }

    public onError(callback: any) {
        this.error_callback = callback
    }


    broadcast(message: any) {
        throw "Not implemented"
    }

    /**
     * 循环所有连接
     * @param callback 
     */
    forEachConnection(callback: any) {
        let object = this._connections
        for (const key in object) {
            if (object.hasOwnProperty(key)) {
                const element = object[key]
                callback(element)
            }
        }
    }

    /**
     * 添加一个连接
     * @param connection 
     */
    addConnection(connection: any) {
        this._connections[connection.id] = connection;
    }

    /**
     * 删除一个连接
     * @param id 
     */
    removeConnection(id: any) {
        delete this._connections[id];
    }

    /**
     * 获取一个连接
     * @param id 
     */
    getConnection(id: string) {
        return this._connections[id];
    }

    /**
     * 获取连接数量
     */
    connectionsCount() {
        return Object.keys(this._connections).length
    }
}

class Connection {
    protected _connection: any
    protected _server: socketIOServer
    id: any
    close_callback: any
    listen_callback: any
    constructor(id: any, connection: any, server: socketIOServer) {
        this._connection = connection;
        this._server = server;
        this.id = id;
    }

    onClose(callback: any) {
        this.close_callback = callback;
    }

    listen(callback: any) {
        this.listen_callback = callback;
    }

    broadcast(message: any) {
        throw "Not implemented";
    }

    send(message: any) {
        throw "Not implemented";
    }

    sendUTF8(data: any) {
        throw "Not implemented";
    }

    close(logError: any) {
        console.log("Closing connection to " + this._connection.remoteAddress + ". Error: " + logError)
        this._connection.close();
    }
}

export class socketIOServer extends Server {
    host: string
    io: any
    status_callback: any
    constructor(host: string, port: number) {
        super(port)
        let self = this
        self.host = host
        self.port = port
        var app = require('express')()
        var http = require('http').Server(app)
        self.io = require('socket.io')(http)


        self.io.on('connection', function (connection: any) {
            console.log('一个用户连接上了')

            connection.remoteAddress = connection.handshake.address.address


            var c = new socketIOConnection(self._createId(), connection, self)

            if (self.连接回调函数) {
                self.连接回调函数(c)
            }
            self.addConnection(c)

        })

        self.io.on('error', function (err: any) {
            console.log(err.stack)
            self.error_callback()

        })

        http.listen(port, function () {
            console.log('listening on *:' + port)
        })
    }

    private _createId() {
        return '5' + require('./utils').random(99) + '' + (this._counter++);
    }


    broadcast(message: any) {
        this.io.emit("message", message)
    }

    onRequestStatus(status_callback: any) {
        this.status_callback = status_callback;
    }

}

export class socketIOConnection extends Connection {
    constructor(id: any, connection: any, server: socketIOServer) {
        super(id, connection, server)
        var self = this

        // HANDLE DISPATCHER IN HERE
        connection.on("dispatch", function (message: any) {
            console.log("收到对调度系统的请求")
            self._connection.emit("dispatched", { "status": "OK", host: server.host, port: server.port })
        })

        connection.on("message", function (message: any) {
            console.log("收到: " + message)
            if (self.listen_callback)
                self.listen_callback(message)
        })

        connection.on("disconnect", function () {
            if (self.close_callback) {
                self.close_callback()
            }
            //delete self._server.removeConnection(self.id);
            self._server.removeConnection(self.id)
        })

    }

    broadcast(message: any) {
        throw "Not implemented";
    }

    send(message: any) {
        this._connection.emit("message", message);
    }

    sendUTF8(data: any) {
        this.send(data)
    }

    close(logError: any) {
        console.log("Closing connection to socket" + ". 异常: " + logError)
        this._connection.disconnect()
    }

}