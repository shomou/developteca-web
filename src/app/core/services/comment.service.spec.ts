import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CommentService } from './comment.service';
import { environment } from '../../../environments/environment';

describe('CommentService', () => {
  let service: CommentService;
  let http: HttpTestingController;

  const base = `${environment.apiUrl}/articles/7/comments`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CommentService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CommentService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('list', () => {
    it('pide la URL anidada bajo el artículo', () => {
      service.list(7).subscribe();
      const req = http.expectOne(r => r.url === base);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [] });
    });

    it('por defecto NO pide los ocultos', () => {
      service.list(7).subscribe();
      const req = http.expectOne(r => r.url === base);
      expect(req.request.params.get('includeRejected')).toBe('false');
      req.flush({ success: true, data: [] });
    });

    it('pide los ocultos cuando se le indica', () => {
      service.list(7, true).subscribe();
      const req = http.expectOne(r => r.url === base);
      expect(req.request.params.get('includeRejected')).toBe('true');
      req.flush({ success: true, data: [] });
    });
  });

  describe('create', () => {
    it('envía POST con el cuerpo tal cual', () => {
      const cuerpo = { content: 'Hola', parentCommentId: null, authorName: 'María' };
      service.create(7, cuerpo).subscribe();

      const req = http.expectOne(base);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(cuerpo);
      req.flush({ success: true, data: {} });
    });

    it('incluye el honeypot cuando viene', () => {
      service.create(7, { content: 'x', parentCommentId: null, website: 'trampa' }).subscribe();
      const req = http.expectOne(base);
      expect(req.request.body.website).toBe('trampa');
      req.flush({ success: true, data: {} });
    });
  });

  describe('moderate', () => {
    // Regresión: usaba http.patch contra un endpoint @PutMapping. No daba 405 sino
    // un 403 desconcertante, porque PATCH no está en setAllowedMethods de la
    // configuración CORS y Spring Security rechazaba la petición antes de enrutarla.
    it('usa PUT, no PATCH', () => {
      service.moderate(7, 3, 'APPROVED').subscribe();

      const req = http.expectOne(`${base}/3/moderate`);
      expect(req.request.method).toBe('PUT');
      req.flush({ success: true, data: {} });
    });

    it('envía el estado destino en el cuerpo', () => {
      service.moderate(7, 3, 'REJECTED').subscribe();
      const req = http.expectOne(`${base}/3/moderate`);
      expect(req.request.body).toEqual({ status: 'REJECTED' });
      req.flush({ success: true, data: {} });
    });

    it('acepta PENDING como destino', () => {
      service.moderate(7, 3, 'PENDING').subscribe();
      const req = http.expectOne(`${base}/3/moderate`);
      expect(req.request.body).toEqual({ status: 'PENDING' });
      req.flush({ success: true, data: {} });
    });
  });

  describe('delete', () => {
    it('envía DELETE a la ruta del comentario', () => {
      service.delete(7, 3).subscribe();
      const req = http.expectOne(`${base}/3`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('construcción de URLs', () => {
    it('usa el articleId recibido, no uno fijo', () => {
      service.list(99).subscribe();
      const req = http.expectOne(r => r.url.includes('/articles/99/comments'));
      req.flush({ success: true, data: [] });
    });

    it('parte de environment.apiUrl y no de una URL escrita a mano', () => {
      service.list(7).subscribe();
      const req = http.expectOne(r => r.url.startsWith(environment.apiUrl));
      req.flush({ success: true, data: [] });
    });
  });
});
