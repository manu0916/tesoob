package com.tesoob.store.web;

import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;

@RestControllerAdvice
public class ApiErrors {
    @ExceptionHandler(ApiException.class)
    ResponseEntity<?> api(ApiException ex) { return response(ex.status, ex.getMessage()); }
    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class, MissingServletRequestParameterException.class, MissingRequestHeaderException.class})
    ResponseEntity<?> validation(Exception ex) { return response(HttpStatus.BAD_REQUEST, "Confira os campos informados."); }
    @ExceptionHandler(AuthenticationException.class)
    ResponseEntity<?> authentication() { return response(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos."); }
    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<?> denied() { return response(HttpStatus.FORBIDDEN, "Você não tem permissão para esta ação."); }
    @ExceptionHandler({DataIntegrityViolationException.class, ObjectOptimisticLockingFailureException.class})
    ResponseEntity<?> conflict() { return response(HttpStatus.CONFLICT, "Dados conflitantes. Atualize a página e tente novamente."); }
    @ExceptionHandler(Exception.class)
    ResponseEntity<?> unexpected() { return response(HttpStatus.INTERNAL_SERVER_ERROR, "Não foi possível concluir a operação."); }
    private ResponseEntity<?> response(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }
}
