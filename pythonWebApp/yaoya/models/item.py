# futureはpythonの標準モジュールで型指定を簡単に反映できるもの
# list,tuple,dictなどは__future__で代替できる
from __future__ import annotations
from dataclasses import dataclass

# dataclassデコレーターを使用するとデータを格納するために使用するもの
# frozen=Trueでイミュータブルなデータクラスを作成する
@dataclass(frozen=True)
class Item:
  item_id: str
  name: str
  price: int
  producing_area: str

  # baseでto_dictが必須としているため作成
  def to_dict(self) -> dict[str, str]:
    return dict(
      item_id = self.item_id,
      name = self.name,
      price = str(self.price),
      producing_area = self.producing_area,
    )
  
  # classmethod：　クラス変数のようにクラスから直接使用できるメソッドのこと
  @classmethod
  # baseでfrom_dictが必須としているため作成
  # クラスメソッドの第1引数は慣習的にcls（そのクラス自身を表す）を指定する→clsを通してプロパティやメソッドにアクセスできる
  def from_dict(cls, data: dict[str, str]) -> Item:
    return Item(
      item_id = data["item_id"],
      name = data["name"],
      price = int(data["price"]),
      producing_area = data["producing_area"],
    )