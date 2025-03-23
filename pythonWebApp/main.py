import streamlit as st

def main():
  st.write("Counter Example")
  # 初期化されているかどうかの確認
  # 初期化されている場合は0を代入し、そうでない場合はreturnする
  if "count" not in st.session_state:
    st.session_state.count = 0
  
  # incrementボタンを反映
  increment = st.button("increment")
  # incrementボタンが押されたら+１
  if increment:
    st.session_state.count += 1

  # decrementボタンを反映
  decrement = st.button("decrement")
  # decrementボタンが押されたら-１
  if decrement:
    st.session_state.count -= 1

  # resetボタンを反映
  reset = st.button("reset")
  # resetボタンが押されたら０
  if reset:
    st.session_state.count = 0

  # カウント数を表示
  st.write("Count = ", st.session_state.count)

if __name__ == "__main__":
  main()