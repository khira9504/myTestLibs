import streamlit as st

def main():
  def page1():
    st.title("Page1")
    
    st.write("Counter Example")
    # 初期化されているかどうかの確認
    # 初期化されている場合は0を代入し、そうでない場合はreturnする
    if "count" not in st.session_state:
      st.session_state.count = 0
    
    # incrementボタンが押されたら+１
    def increment_counter():
      st.session_state.count += 1
    # incrementボタンを反映
    st.button("increment", on_click=increment_counter)

    # decrementボタンが押されたら-１
    def decrement_counter():
      st.session_state.count -= 1
    # decrementボタンを反映
    st.button("decrement", on_click=decrement_counter)

    # resetボタンが押されたら０
    def reset_counter():
      st.session_state.count = 0
    # resetボタンを反映
    st.button("reset", on_click=reset_counter)

    # カウント数を表示
    st.write("Count = ", st.session_state.count)


  def page2():
    st.title("What's your name?")

    def change_page():
      st.session_state["page-select"] = "page2"
    
    with st.form(key="name-form"):
      # 見出しはMessageの入力フィールドを作成
      # 入力された内容はsessionに反映される
      st.text_input("Name", key="name")
      # クリックするとページ2に遷移する
      st.form_submit_button(label="Submit", on_click=change_page)

  def page3():
    name = st.session_state["name"]
    st.title(f"Hello {name}")

  # dictはJSで言えばオブジェクト構造のこと（＝で繋げてデータ構造を作成する）
  pages = dict(
    page1 = "カウンター",
    page2 = "名前設定",
    page3 = "名前表示",
  )

  # st.sidebar.*でサイドバーを作成する
  page_id = st.sidebar.selectbox(
    # 見出し名
    "ページ名",
    # 表示する項目
    ["page1", "page2", "page3"],
    # 描画項目を日本語に変換
    format_func = lambda page_id: pages[page_id],
    # page-selectの名前でセッション管理
    key = "page-select",
  )

  if page_id == "page1":
    page1()

  if page_id == "page2":
    page2()

  if page_id == "page3":
    page3()

if __name__ == "__main__":
  main()