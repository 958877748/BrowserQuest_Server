namespace main {
    /**
     * `Socket.io 连接封装`
     * 每个连接对应一个玩家
     */
    export class SocketIOConnection extends Connection {
        constructor(id: string, connection: any, server: SocketIOServer) {
            super(id, connection, server)
            let self = this

            // HANDLE DISPATCHER IN HERE
            connection.on("dispatch", function (message: any) {
                console.log("收到对调度系统的请求")
                self._connection.emit("dispatched", { "status": "OK", host: server.host, port: server.port })
            })

            connection.on("message", function (message: any) {
                //当连接收到消息时,调用消息回调
                if (self.listen_callback){
                    self.listen_callback(message)
                }
            })

            connection.on("disconnect", function () {
                //当连接关闭时,调用关闭回调
                if (self.close_callback) {
                    self.close_callback()
                }
                //从连接所在服务器删除连接
                self.server.removeConnection(self.id)
            })

        }

        broadcast(message: any) {
            throw "Not implemented";
        }

        send(message: any) {
            this._connection.emit("message", message);
        }

        sendUTF8(data: string) {
            this.send(data)
        }

        close(logError: string) {
            console.log("正在关闭与socket的连接" + ". 异常: " + logError)
            this._connection.disconnect()
        }
    }
}