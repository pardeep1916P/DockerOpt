use std::io::Write;
use std::net::TcpListener;

fn main() {
    let listener = TcpListener::bind("0.0.0.0:8080").unwrap();
    println!("Rust Server running on port 8080");

    for stream in listener.incoming() {
        let mut stream = stream.unwrap();
        let response = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n{\"message\":\"Docker Size Test - Rust\",\"status\":\"ok\"}";
        stream.write_all(response.as_bytes()).unwrap();
    }
}
