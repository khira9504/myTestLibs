import socket

class TCPClient:
  def request(self):
    print("=== クライアントを起動 ===")

    try:
      # socketを作成
      client_socket = socket.socket()
      client_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

      # サーバーと接続
      print("=== サーバー接続試行 ===")
      # サーバーとは異なり待機する必要はないためbind（）やlisten（）は不要
      # connect（）メソッドを呼び出してTCPサーバーへ接続する
      # カッコ内はApacheが起動しているポート番号（クライアント側のポート番号は自動割り当てされる）
      client_socket.connect(("127.0.0.1", 80))
      print("=== サーバー接続完了 ===")

      # サーバーに送信するリクエストをファイルから取得
      # rbはバイナリファイルの読み込み
      with open("client_send.txt", "rb") as f:
        request = f.read()
      
      # サーバーへリクエストを送信（sendの引数はbytes型）
      client_socket.send(request)

      # サーバーからレスポンスを待機→取得（ブロッキング処理）
      response = client_socket.recv(4096)

      # レスポンスの内容をファイル保存
      # wbはバイナリファイルへの書き込み
      with open("client_recv.txt", "wb") as f:
        f.write(response)

      # 通信を終了
      client_socket.close()

    finally:
      print("=== クライアント停止 ===")

if __name__ == "__main__":
  client = TCPClient()
  client.request()