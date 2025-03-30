# futureはpythonの標準モジュールで型指定を簡単に反映できるもの
# list,tuple,dictなどは__future__で代替できる
from __future__ import annotations
import json
from dataclasses import dataclass
from yaoya.models.base import BaseDataModel
from yaoya.models.item import Item

# dataclassデコレーターを使用するとデータを格納するために使用するもの
# frozen=Trueでイミュータブルなデータクラスを作成する
@dataclass(frozen=True)
class CartItem(BaseDataModel):
  item: Item
  quantity: int = 0

  def to_dict(self) -> dict[str, str]:
    item_dict = self.item.to_dict()
    return dict(
      item = json.dumps(item_dict),
      quantity = str(self.quantity)
    )
  
  # classmethod：　クラス変数のようにクラスから直接使用できるメソッドのこと
  @classmethod
  def from_dict(cls, data: dict[str, str]) -> CartItem:
    item_data = json.loads(data["item"])
    return CartItem(
      item = Item.from_dict(item_data),
      quantity = int(data["quantity"])
    )
  
