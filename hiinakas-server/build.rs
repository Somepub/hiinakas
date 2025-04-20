use std::fs;

fn main() {
    let current_dir = std::env::current_dir().unwrap();
    let proto_dir = current_dir.parent().unwrap().join("hiinakas-types").join("src");
    let out_dir = current_dir.join("src").join("proto");
    
    // Create proto directory if it doesn't exist
    fs::create_dir_all(&out_dir).unwrap();

    let protos = [
        proto_dir.join("card.proto"),
        proto_dir.join("game.proto"),
        proto_dir.join("lobby.proto"),
        proto_dir.join("ws.proto")
    ];

    // Debug prints
    println!("Current dir: {:?}", current_dir);
    println!("Proto dir: {:?}", proto_dir);
    println!("Out dir: {:?}", out_dir);

    for proto in &protos {
        println!("Checking path: {:?}", proto);
        if proto.exists() {
            println!("✅ File exists: {:?}", proto);
        } else {
            println!("❌ File not found: {:?}", proto);
        }
    }

    tonic_build::configure()
        .out_dir(&out_dir)
        .include_file("mod.rs")
        .compile(
            &protos.iter().map(|p| p.to_str().unwrap()).collect::<Vec<_>>(),
            &[proto_dir.to_str().unwrap()]
        )
        .unwrap_or_else(|e| panic!("Failed to compile protos: {:?}", e));
}