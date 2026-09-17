use crate::proto::hotpaxel::v1::font_service_server::FontService;
use crate::proto::hotpaxel::v1::{
    DownloadFontRequest, FontChunk, FontListResponse, HealthCheckRequest, ValidateFontRequest,
    ValidateFontResponse,
};
use std::path::Path;
use tokio::fs;
use tokio::sync::mpsc;
use tokio_stream::wrappers::UnboundedReceiverStream;
use tonic::{Request, Response, Status};

pub struct MyFontService {
    pub static_dir: String,
}

#[tonic::async_trait]
impl FontService for MyFontService {
    async fn get_fonts(
        &self,
        _request: Request<HealthCheckRequest>,
    ) -> Result<Response<FontListResponse>, Status> {
        Ok(Response::new(FontListResponse { fonts: vec![] }))
    }

    type DownloadFontStream = UnboundedReceiverStream<Result<FontChunk, Status>>;

    async fn download_font(
        &self,
        request: Request<DownloadFontRequest>,
    ) -> Result<Response<Self::DownloadFontStream>, Status> {
        let req = request.into_inner();
        let font_path = Path::new(&self.static_dir)
            .join("fonts")
            .join(&req.file_name);

        if !font_path.exists() {
            return Err(Status::not_found("Font not found"));
        }

        let (tx, rx) = mpsc::unbounded_channel();
        tokio::spawn(async move {
            match fs::read(font_path).await {
                Ok(bytes) => {
                    let _ = tx.send(Ok(FontChunk { data: bytes }));
                }
                Err(e) => {
                    let _ = tx.send(Err(Status::internal(format!("Failed to read font: {e}"))));
                }
            }
        });

        Ok(Response::new(UnboundedReceiverStream::new(rx)))
    }

    async fn validate_font(
        &self,
        _request: Request<ValidateFontRequest>,
    ) -> Result<Response<ValidateFontResponse>, Status> {
        Ok(Response::new(ValidateFontResponse {
            is_valid: true,
            family_name: Some("Mock Font".to_string()),
            error_message: Some(String::new()),
        }))
    }
}
