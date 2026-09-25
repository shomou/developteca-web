import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ArticleService } from './article.service';
import { environment } from '../../../environments/environment';

describe('ArticleService', () => {
  let service: ArticleService;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/articles`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ArticleService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ArticleService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('listado público', () => {
    it('omite los parámetros opcionales que no se pasan', () => {
      service.list({ page: 0, size: 9 }).subscribe();

      const req = http.expectOne(r => r.url === base);
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.has('category')).toBe(false);
      expect(req.request.params.has('search')).toBe(false);
      req.flush({ success: true, data: { content: [] } });
    });

    it('incluye categoría y búsqueda cuando sí se pasan', () => {
      service.list({ category: 'backend', search: 'docker' }).subscribe();

      const req = http.expectOne(r => r.url === base);
      expect(req.request.params.get('category')).toBe('backend');
      expect(req.request.params.get('search')).toBe('docker');
      req.flush({ success: true, data: { content: [] } });
    });
  });

  describe('gestión', () => {
    it('listForManagement apunta a /manage, no al listado público', () => {
      service.listForManagement({}).subscribe();
      const req = http.expectOne(r => r.url === `${base}/manage`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: { content: [] } });
    });

    it('filtra por estado cuando se indica', () => {
      service.listForManagement({ status: 'DRAFT' }).subscribe();
      const req = http.expectOne(r => r.url === `${base}/manage`);
      expect(req.request.params.get('status')).toBe('DRAFT');
      req.flush({ success: true, data: { content: [] } });
    });

    // getForEdit usa /manage/{id}, no /{slug}: el público nunca debe poder
    // llegar a un borrador, y abrir el editor no cuenta como visita.
    it('getForEdit busca por id bajo /manage', () => {
      service.getForEdit(12).subscribe();
      const req = http.expectOne(`${base}/manage/12`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: {} });
    });

    it('getBySlug usa la ruta pública por slug', () => {
      service.getBySlug('mi-articulo').subscribe();
      const req = http.expectOne(`${base}/mi-articulo`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: {} });
    });
  });

  describe('escritura', () => {
    it('create envía POST', () => {
      service.create({ title: 'T', content: 'C', categoryId: 1 }).subscribe();
      const req = http.expectOne(base);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, data: {} });
    });

    it('update envía PUT a la ruta del artículo', () => {
      service.update(5, { title: 'T', content: 'C', categoryId: 1, status: 'PUBLISHED' }).subscribe();
      const req = http.expectOne(`${base}/5`);
      expect(req.request.method).toBe('PUT');
      req.flush({ success: true, data: {} });
    });

    it('delete envía DELETE a la ruta del artículo', () => {
      service.delete(5).subscribe();
      const req = http.expectOne(`${base}/5`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('subida de imágenes', () => {
    const archivo = () => new File(['x'], 'foto.png', { type: 'image/png' });

    it('envía FormData, no JSON', () => {
      service.uploadImage(5, archivo(), 'alt', false).subscribe();

      const req = http.expectOne(`${base}/5/images`);
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush({ success: true, data: {} });
    });

    // Angular debe poner el boundary del multipart: si se fija Content-Type a
    // mano, va sin boundary y el backend responde 400 con un archivo válido.
    it('NO fija Content-Type a mano', () => {
      service.uploadImage(5, archivo(), 'alt', false).subscribe();

      const req = http.expectOne(`${base}/5/images`);
      expect(req.request.headers.has('Content-Type')).toBe(false);
      req.flush({ success: true, data: {} });
    });

    it('manda isFeatured como texto, que es lo que admite FormData', () => {
      service.uploadImage(5, archivo(), 'alt', true).subscribe();

      const req = http.expectOne(`${base}/5/images`);
      const body = req.request.body as FormData;
      expect(body.get('isFeatured')).toBe('true');
      expect(body.get('altText')).toBe('alt');
      req.flush({ success: true, data: {} });
    });

    it('deleteImage apunta a la imagen dentro del artículo', () => {
      service.deleteImage(5, 9).subscribe();
      const req = http.expectOne(`${base}/5/images/9`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
