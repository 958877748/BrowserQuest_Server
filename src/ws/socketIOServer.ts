namespace main{
    /** 
     * `socket.io 服务器`
     * 一个服务器上会有多个连接
     **/
    export class SocketIOServer extends Server {

        public host: string
        public io: any
        public status_callback: any

        constructor(host: string, port: number) {
            super(port)
            let { http, io } = getIO()
            let self = this
            self.host = host
            self.io = io

            self.io.on('connection', function (connection: any) {
                console.log('一个用户连接上了')

                connection.remoteAddress = connection.handshake.address.address

                let socketIOConnection = new SocketIOConnection(self._createId(), connection, self)

                if (self.connection_callback) {
                    self.connection_callback(socketIOConnection)
                }
                self.addConnection(socketIOConnection)

            })

            self.io.on('error', function (err: any) {
                console.log(err.stack)
                self.error_callback()
            })

            http.listen(self.port, function () {
                console.log('监听端口:' + self.port)
            })
        }

        private _createId() {
            return '5' + Utils.random(99) + '' + (this.counter++)
        }

        broadcast(message: any) {
            this.io.emit("message", message)
        }

        onRequestStatus(status_callback: any) {
            this.status_callback = status_callback
        }
    }
}