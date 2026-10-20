const AUDIT_LABELS: Record<string, string> = {
  "course.settings_updated": "Configurações da formação atualizadas",
  "module.created": "Módulo criado",
  "module.updated": "Módulo editado",
  "module.moved": "Módulo reordenado",
  "module.published": "Módulo publicado",
  "module.unpublished": "Módulo despublicado",
  "module.deleted": "Módulo excluído",
  "module.requirements_updated": "Requisitos do módulo atualizados",
  "lesson.created": "Aula criada",
  "lesson.updated": "Aula editada",
  "lesson.moved": "Aula reordenada",
  "lesson.published": "Aula publicada",
  "lesson.unpublished": "Aula despublicada",
  "lesson.deleted": "Aula excluída",
  "lesson.video_uploaded": "Vídeo da aula enviado",
  "module_access.granted": "Acesso manual liberado",
  "module_access.revoked": "Acesso manual revogado",
  "certificate.issued": "Certificado emitido",
  "certificate.revoked": "Certificado revogado",
  "quiz.passed": "Prova do módulo aprovada",
  "quiz.failed": "Prova do módulo não aprovada",
  "broker.customer_linked": "Conta da corretora vinculada",
  "broker.eligibility_updated": "Elegibilidade da corretora atualizada",
  "broker.deposit_redirect": "Redirecionado para depósito oficial",
};

export function auditLabel(action: string): string {
  return AUDIT_LABELS[action] ?? action;
}
