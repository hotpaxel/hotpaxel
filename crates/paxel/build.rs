fn main() -> Result<(), Box<dyn std::error::Error>> {
    let proto_files = &[
        "../../proto/hotpaxel/v1/types/asset.proto",
        "../../proto/hotpaxel/v1/types/compile.proto",
        "../../proto/hotpaxel/v1/types/font.proto",
        "../../proto/hotpaxel/v1/types/system.proto",
        "../../proto/hotpaxel/v1/compiler_service.proto",
        "../../proto/hotpaxel/v1/font_service.proto",
        "../../proto/hotpaxel/v1/system_service.proto",
    ];

    tonic_build::configure()
        .build_server(true)
        .compile_protos(proto_files, &["../../proto"])?;

    Ok(())
}
