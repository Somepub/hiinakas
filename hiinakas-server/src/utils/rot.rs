
pub struct Rot {
    pub key: String,
}

impl Rot {
    pub fn new(key: String) -> Self {
        Self { key }
    }

    pub fn encrypt_rot13(&self) -> String {
        self.key.chars()
        .map(|c| match c {
            'A'..='M' | 'a'..='m' => ((c as u8) + 13) as char,
            'N'..='Z' | 'n'..='z' => ((c as u8) - 13) as char,
            _ => c,
        })
        .collect()
    }

    pub fn decrypt_rot13(&self) -> String {
        self.key.chars()
        .map(|c| match c {
            'A'..='M' | 'a'..='m' => ((c as u8) - 13) as char,
            'N'..='Z' | 'n'..='z' => ((c as u8) + 13) as char,
            _ => c,
        })
        .collect()
    }

    pub fn encrypt_rot47(&self) -> String {
        self.key.chars()
        .map(|c| {
            if c as u8 >= 33 && c as u8 <= 126 {
                ((c as u8 - 33 + 47) % 94 + 33) as char
            } else {
                c
            }
        })
        .collect::<String>()
    }
}