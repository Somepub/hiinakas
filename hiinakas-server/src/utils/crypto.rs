use std::error::Error;

use openssl::{
    base64, rand,
    symm::{ Cipher, Crypter, Mode},
};
use tracing::debug;

use crate::utils::rot::Rot;

pub struct Crypto {
    pub rot: Rot,
}

impl Crypto {
    pub fn new(key: String) -> Self {
        Self { rot: Rot::new(key) }
    }

    pub fn encrypt_message_connect(&self, message: &str) -> Result<String, Box<dyn std::error::Error>> {
        let rot = self.rot.encrypt_rot13();
        if rot.is_empty() || message.is_empty() {
            //debug!("message: {}", message);
            //debug!("rot: {}", rot);
            return Err("Invalid key or message".into());
        }
        
        Ok(self.encrypt(message, rot.as_bytes())?)
    }

    pub fn decrypt_message_connect(&self, message: &str) -> Result<String, Box<dyn std::error::Error>> {
        let rot = self.rot.encrypt_rot13();
        if rot.is_empty() || message.is_empty() {
            return Err("Invalid key or message".into());
        }

        Ok(self.decrypt(message, rot.as_bytes())?)
    }

    pub fn encrypt_message_winner(&self, message: &str) -> Result<String, Box<dyn std::error::Error>> {
        let rot = self.rot.encrypt_rot47();
        if rot.is_empty() || message.is_empty() {
            return Err("Invalid key or message".into());
        }

        Ok(self.encrypt(message, rot.as_bytes())?)
    }

    pub fn encrypt(&self, message: &str, key: &[u8]) -> Result<String, Box<dyn std::error::Error>> {
        let mut key_32 = [0u8; 32];
        key_32[..key.len().min(32)].copy_from_slice(&key[..key.len().min(32)]);
    
        let mut iv = [0u8; 16];
        rand::rand_bytes(&mut iv)?;
    
        let cipher = Cipher::aes_256_cbc();
        let mut encryptor = Crypter::new(cipher, Mode::Encrypt, &key_32, Some(&iv))?;
        encryptor.pad(true);
    
        let data = message.as_bytes();
        let mut encrypted = vec![0; data.len() + cipher.block_size()];
        let count = encryptor.update(data, &mut encrypted)?;
        let final_count = encryptor.finalize(&mut encrypted[count..])?;
        encrypted.truncate(count + final_count);
    
        let mut result = Vec::with_capacity(iv.len() + encrypted.len());
        result.extend_from_slice(&iv);
        result.extend_from_slice(&encrypted);
    
        Ok(base64::encode_block(&result))
    }

    pub fn decrypt(&self, encrypted_base64: &str, key: &[u8]) -> Result<String, Box<dyn Error>> {
        let encrypted = base64::decode_block(encrypted_base64)?;
    
        let iv = &encrypted[..16];
        let ciphertext = &encrypted[16..];
    
        let mut key_32 = [0u8; 32];
        key_32[..key.len().min(32)].copy_from_slice(&key[..key.len().min(32)]);
    
        let cipher = Cipher::aes_256_cbc();
        let decrypted = openssl::symm::decrypt(cipher, &key_32, Some(iv), ciphertext)?;
    
        Ok(String::from_utf8(decrypted)?)
    }
}