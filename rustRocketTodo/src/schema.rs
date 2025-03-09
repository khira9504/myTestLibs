// @generated automatically by Diesel CLI.

diesel::table! {
    tasks (id) {
        id -> Integer,
        title -> Text,
        done -> Bool,
        username -> Text,
    }
}

diesel::table! {
    users (username) {
        username -> Text,
        password -> Text,
    }
}

diesel::joinable!(tasks -> users (username));

diesel::allow_tables_to_appear_in_same_query!(
    tasks,
    users,
);