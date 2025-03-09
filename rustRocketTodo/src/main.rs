#[macro_use] extern crate rocket;

// getルートのハンドラーを示すマクロ
#[get("/")]
// index関数の返り値が文字列を示す
fn index() -> &'static str {
  "Hello, world from Rocket!"
}

// このlaunchアトリビュート付きのrocket関数はアプリのエンドポイント
#[launch]
fn rocket() -> _ {
  rocket::build().mount("/", routes![index])
}