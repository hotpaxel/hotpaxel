use crate::proto::hotpaxel::v1::system_service_server::SystemService;
use crate::proto::hotpaxel::v1::{HealthCheckRequest, HealthCheckResponse, VersionRequest, VersionResponse};
use tonic::{Request, Response, Status};

pub struct MySystemService {}

#[tonic::async_trait]
impl SystemService for MySystemService {
    async fn health_check(
        &self,
        _request: Request<HealthCheckRequest>,
    ) -> Result<Response<HealthCheckResponse>, Status> {
        Ok(Response::new(HealthCheckResponse {
            status: "OK".to_string(),
        }))
    }

    async fn get_version(
        &self,
        _request: Request<VersionRequest>,
    ) -> Result<Response<VersionResponse>, Status> {
        Ok(Response::new(VersionResponse {
            version: env!("CARGO_PKG_VERSION").to_string(),
            name: env!("CARGO_PKG_NAME").to_string(),
        }))
    }
}
