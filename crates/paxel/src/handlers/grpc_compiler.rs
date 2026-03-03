use crate::handlers::compiler::execute_compilation;
use crate::models::CompileRequest as RestCompileRequest;
use crate::proto::hotpaxel::v1::compile_response::Result as ProtoResult;
use crate::proto::hotpaxel::v1::compiler_service_server::CompilerService;
use crate::proto::hotpaxel::v1::{CompileRequest, CompileResponse};
use tokio::sync::mpsc;
use tokio_stream::wrappers::ReceiverStream;
use tonic::{Request, Response, Status};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};

pub struct MyCompiler {}

#[tonic::async_trait]
impl CompilerService for MyCompiler {
    type CompileStream = ReceiverStream<Result<CompileResponse, Status>>;

    async fn compile(
        &self,
        request: Request<CompileRequest>,
    ) -> Result<Response<Self::CompileStream>, Status> {
        let req = request.into_inner();
        let (tx, rx) = mpsc::channel(4);

        tokio::spawn(async move {
            let rest_req = RestCompileRequest {
                tex: req.tex,
                assets: req.assets.into_iter().map(|a| crate::models::Asset {
                    name: a.name,
                    content: BASE64.encode(a.content),
                }).collect(),
                passes: req.passes.map(|p| p as u8),
            };

            match execute_compilation(rest_req).await {
                Ok(pdf_bytes) => {
                    let _ = tx.send(Ok(CompileResponse {
                        result: Some(ProtoResult::PdfChunk(pdf_bytes)),
                    })).await;
                }
                Err(err) => {
                    let _ = tx.send(Ok(CompileResponse {
                        result: Some(ProtoResult::ErrorMessage(err.error.message)),
                    })).await;
                }
            }
        });

        Ok(Response::new(ReceiverStream::new(rx)))
    }
}
