import socket

class TCPServer:
  def serve(self):
    print("===サーバーを起動===")
    try:
      # SOCKETを作成
      # SOCKETとは自分もしくは第三者のPCと通信を行うための仕組み（ローカルホストを立てる）
      server_socket = socket.socket()
      server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

      # SOCKETをlocalhostの8080番に割り当てる
      server_socket.bind(("localhost", 8080))
      server_socket.listen(10)

      # 外部の接続待機→接続後にコネクション確立
      print("===クライアントからの接続待機===")
      (client_socket, address) = server_socket.accept()
      # fがないとaddressがコンソール上に出力されない
      print(f"=== クライアントと接続完了 remote_address: {address} ===")

      # クライアントから送られてきたデータを取得する
      # recvは接続からデータを受信する（数値はデータのサイズ）
      request = client_socket.recv(4096)

      # クライアントから送られてきたデータをファイルに保存
      # withはファイル操作に必要な処理を簡潔に記載できる
      with open("serve_recv.txt", "wb") as f:
        f.write(request)

      # 通信を終了
      client_socket.close()

    finally:
      print("===サーバーを停止===")

if __name__ == "__main__":
  server = TCPServer()
  server.serve()