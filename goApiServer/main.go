// ヘルスチェックを実行するコード
package main
import (
	"context"
	"github.com/khira9504/myTestLibs/goApiServer/api/internal/presenter"
)

func main() {
	// サーバーを実行するためのpresenter.Server構造体を生成するNew関数
	srv := presenter.NewServer()
	// context.Background()は空のコンテキストを生成+Run関数でサーバー実行
	if err := srv.Run(context.Background()); err != nil {
		// プログラムの実行時エラー(ランタイムエラー)のことをパニックと呼ぶ
		// panic関数はエラー表示をするための関数
		panic(err)
	}
}