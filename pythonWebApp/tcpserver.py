import socket

class TCPServer:
  def serve(self):
    print("===サーバーを起動===")
    try:
      # SOCKETを作成
      # SOCKETとはpythonの組み込みライブラリで自分もしくはその他マシンと通信を行うための仕組み（ローカルホストを立てる）
      server_socket = socket.socket()
      server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

      # SOCKETをlocalhostの8080番に割り当てる
      # bind（）は実行プログラムとマシンポートを紐付けする
      server_socket.bind(("localhost", 8080))
      # listen()はsocketにbind済みのポートをプログラムに割り当て
      # カッコ内の数字は同時接続クライアントの最大数
      server_socket.listen(10)

      # 外部の接続待機→接続後にコネクション確立
      print("===クライアントからの接続待機===")
      # accept()は接続待ちのクライアントがいれば接続するがいない場合は接続要求があるまで待機する（ブロッキング処理なため注意）
      (client_socket, address) = server_socket.accept()
      # fがないとaddressがコンソール上に出力されない
      print(f"=== クライアントと接続完了 remote_address: {address} ===")

      # クライアントから送られてきたデータを取得する
      # recvは接続からデータを受信する（数値はデータのサイズ、ブロッキング処理）
      # ネットワークバッファから4096バイトずつ繰り返してデータを取得
      request = client_socket.recv(4096)

      # クライアントから送られてきたデータをファイルに保存
      # withはファイル操作に必要な処理を簡潔に記載できる
      # wbはバイナリファイルへの書き込み
      with open("serve_recv.txt", "wb") as f:
        f.write(request)

      # クライアントに送信するレスポンスデータをファイルから取得する
      with open("server_send.txt", "rb") as f:
        response = f.read()

      # クライアントにレスポンスを送信する
      client_socket.send(response)

      # 通信を終了（接続終了時は必ず記載）
      client_socket.close()

    finally:
      print("===サーバーを停止===")

if __name__ == "__main__":
  # TCPServerクラスをインスタンス化
  server = TCPServer()
  # serveメソッドを呼び出してサーバー起動
  server.serve()