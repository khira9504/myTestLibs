package presenter
import (
	"context"
	"github.com/gin-gonic/gin"
	"github.com/khira9504/myTestLibs/goApiServer/api/internal/controller/system"
	"github.com/khira9504/myTestLibs/goApiServer/api/internal/controller/user"
)

const latest = "v1"

// Server型
type Server struct {}

// 無名関数
func (s *Server) Run(ctx context.Context) error {
	// 変数定義は[変数名] := [変数の値]をする
	// 型指定は行われず型推論が行われる
	r := gin.Default()
	v1 := r.Group(latest)

	// 死活監視用
	{
		systemHandler := system.NewSystemHandler()
		v1.GET("/health", systemHandler.Health)
	}

	// ユーザー管理機能
	{
		userHandler := user.NewUserHandler()
		v1.GET("", userHandler.GetUsers)
		v1.GET("/:id", userHandler.GetUserById)
		v1.POST("", userHandler.EditUser)
		v1.DELETE("/:id", userHandler.DeleteUser)
	}

	err := r.Run()
	if err != nil {
		return err
	}

	return nil
}

// *はポインタ→変数の役割
// 下記はServerへのポインター型の意味
func NewServer() *Server {
	// ＆⚪︎⚪︎{}は変数→ポインターの役割
	return &Server{}
}