type ApiErrorPayload = {
  error?: string;
  detail?: string;
  message?: string;
};

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: ApiErrorPayload | string } })?.response?.data;

  if (typeof data === 'string') {
    return translateApiError(data);
  }

  const message = data?.error ?? data?.detail ?? data?.message;
  if (typeof message === 'string') {
    return translateApiError(message);
  }

  return fallback;
}

function translateApiError(message: string): string {
  const duplicateScheduleMatch = message.match(
    /^A shift with the same schedule already exists: (.+)\. Please edit the existing shift\.$/
  );
  if (duplicateScheduleMatch) {
    return `Ya existe un turno con el mismo horario: ${duplicateScheduleMatch[1]}. Editá el turno existente.`;
  }

  const overlapMatch = message.match(
    /^This shift overlaps with (.+)\. Please edit the existing shift\.$/
  );
  if (overlapMatch) {
    return `Ya existe un turno con el mismo horario: ${overlapMatch[1]}. Editá el turno existente.`;
  }

  if (message === 'Start time must be before end time for the shift.') {
    return 'La hora de inicio debe ser anterior a la hora de fin.';
  }

  return message;
}
