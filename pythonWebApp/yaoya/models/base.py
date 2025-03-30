# futureはpythonの標準モジュールで型指定を簡単に反映できるもの
# list,tuple,dictなどは__future__で代替できる
from __future__ import annotations
# ダックタイピング：動的型付けの性質を応用させた考え方
# オブジェクトの型ではなくオブジェクトが持つメソッドや属性によって振る舞いを判断するパラダイム
# 下記は静的型付けの恩恵を受けながらダックタイピングをすることができる
# Protocolは特定のメソッドや属性を持つことを型として明示的に定義できる
from typing import Protocol

# BaseDataModelはデータモデルの基本的なインターフェースを定義するプロトコルクラス
# このクラスを継承する全てのクラスは、以下のメソッドを実装する必要がある
class BaseDataModel(Protocol):
    # to_dict メソッド：
    # オブジェクトの属性を辞書形式に変換するメソッド
    # 戻り値: 文字列をキーと値に持つ辞書
    def to_dict(self) -> dict[str, str]:
      # pass: コードとして何も実装したくない時に使用する
      pass

    # from_dict クラスメソッド：
    # 辞書形式のデータからオブジェクトを生成するメソッド
    # 引数: 文字列をキーと値に持つ辞書
    # 戻り値: BaseDataModelのインスタンス
    @classmethod
    def from_dict(cls, data: dict[str, str]) -> BaseDataModel:
      # pass: コードとして何も実装したくない時に使用する
      pass 