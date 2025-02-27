# Benchmarking

## Connect

### Nodejs
* $${\color{red}0.200ms - 0.600ms}$$
### Rust
* $${\color{lightgreen}0.170ms -  0.379ms}$$

## Queue

### Nodejs
* $${\color{red}0.314ms - 19.896ms}$$
### Rust
* $${\color{lightgreen}0.0408ms - 0.1558ms}$$

## Turn

### Nodejs
* $${\color{red}0.921ms - 1.712ms}$$
### Rust
* $${\color{lightgreen}0.0545ms - 0.1193ms}$$

## Disconnect

### Nodejs
* $${\color{red}0.237ms - 0.606ms}$$
### Rust
* $${\color{lightgreen}0.2003ms - 0.3486ms}$$

## Statistics

### Nodejs
* $${\color{red}54 bytes}$$
### Rust
* $${\color{lightgreen}28 bytes}$$



# Data size

## Queue

### Nodejs
* $${\color{lightgreen}102 + 61 bytes}$$
### Rust
* $${\color{red}186 + 24 bytes}$$ 

## Turn

### Nodejs
* Inital: $${\color{red}3353 bytes}$$
* Play: $${\color{lightgreen}204 + 3350 bytes}$$
* End: $${\color{lightgreen}157 + 3374 bytes}$$
### Rust
* Inital: $${\color{lightgreen}806 bytes}$$
* Play: $${\color{red}424 + 678 bytes}$$
* End: $${\color{red}306 + 804 bytes}$$

## Disconnect

### Nodejs
* $${\color{red}3421 bytes}$$
### Rust
* $${\color{lightgreen}811 bytes}$$

## Statistics

### Nodejs
* $${\color{red}54 bytes}$$
### Rust
* $${\color{lightgreen}28 bytes}$$
