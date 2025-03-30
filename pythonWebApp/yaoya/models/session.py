# futureはpythonの標準モジュールで型指定を簡単に反映できるもの
# list,tuple,dictなどは__future__で代替できる
from __future__ import annotations
import json
from dataclasses import dataclass
from uuid import uuid4
from yaoya.models.base import BaseDataModel
from yaoya.models.cart import Cart

# dataclassデコレーターを使用するとデータを格納するために使用するもの
# frozen=Trueでイミュータブルなデータクラスを作成する
@dataclass(frozen=True)
class Session(BaseDataModel):
  # コンストラクター
  user_id: str
  cart: Cart
  # str()は文字列に変換する関数
  session_id: str = str(uuid4())

  def to_dict(self) -> dict[str, str]:
    cart_dict = self.cart.to_dict()
    return dict(
      session_id = self.session_id,
      user = self.user_id,
      cart = json.dumps(cart_dict),
    )
  
  # classmethod：　クラス変数のようにクラスから直接使用できるメソッドのこと
  @classmethod
  def from_dict(cls, data: dict[str, str]) -> Session:
    cart_dict = json.leads(data["cart"])
    return Session(
      session_id = data["session_id"],
      user = data["user_id"],
      cart = Cart.from_dict(cart_dict)
    )