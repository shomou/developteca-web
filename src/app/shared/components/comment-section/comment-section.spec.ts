import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CommentSection } from './comment-section';
import { AuthService } from '../../../core/services/auth.service';
import { Comment } from '../../../core/models/comment.model';
import { environment } from '../../../../environments/environment';

describe('CommentSection', () => {
  let componente: CommentSection;
  let auth: AuthService;
  let http: HttpTestingController;

  const base = `${environment.apiUrl}/articles/7/comments`;

  const comentario = (over: Partial<Comment> = {}): Comment => ({
    id: 1, content: 'texto',
    author: { id: 10, firstName: 'Ada', lastName: 'Lovelace' },
    authorName: null, createdAt: '2026-01-01T10:00:00',
    status: 'APPROVED', replies: [], ...over,
  });

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [CommentSection],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(CommentSection);
    componente = fixture.componentInstance;
    componente.articleId = 7;
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => localStorage.clear());

  const sesion = (autenticado: boolean, admin = false) => {
    vi.spyOn(auth, 'isAuthenticated').mockReturnValue(autenticado);
    vi.spyOn(auth, 'isAdmin').mockReturnValue(admin);
  };

  describe('carga de comentarios', () => {
    it('un visitante no pide los ocultos', () => {
      sesion(false);
      componente.loadComments();

      const req = http.expectOne(r => r.url === base);
      expect(req.request.params.get('includeRejected')).toBe('false');
      req.flush({ success: true, data: [] });
    });

    it('un admin sí los pide', () => {
      sesion(true, true);
      componente.loadComments();

      const req = http.expectOne(r => r.url === base);
      expect(req.request.params.get('includeRejected')).toBe('true');
      req.flush({ success: true, data: [] });
    });
  });

  describe('envío como visitante', () => {
    beforeEach(() => sesion(false));

    it('exige el nombre y no llega a hacer la petición', () => {
      componente.newComment = 'Hola';
      componente.authorName = '   ';

      componente.onSubmit();

      expect(componente.errorMessage()).toContain('nombre');
      http.expectNone(base);
    });

    it('envía nombre, email y honeypot', () => {
      componente.newComment = 'Hola';
      componente.authorName = 'María';
      componente.authorEmail = 'maria@example.com';

      componente.onSubmit();

      const req = http.expectOne(base);
      expect(req.request.body.authorName).toBe('María');
      expect(req.request.body.authorEmail).toBe('maria@example.com');
      expect(req.request.body).toHaveProperty('website');
      req.flush({ success: true, data: comentario({ status: 'PENDING' }) });
      http.expectOne(r => r.url === base).flush({ success: true, data: [] });
    });

    it('omite el email si se deja vacío, en vez de enviar cadena vacía', () => {
      componente.newComment = 'Hola';
      componente.authorName = 'María';
      componente.authorEmail = '';

      componente.onSubmit();

      const req = http.expectOne(base);
      expect(req.request.body.authorEmail).toBeUndefined();
      req.flush({ success: true, data: comentario({ status: 'PENDING' }) });
      http.expectOne(r => r.url === base).flush({ success: true, data: [] });
    });

    // Sin este aviso el área de texto se vacía, no aparece nada en la lista, y
    // el visitante concluye razonablemente que la web está rota.
    it('muestra el aviso de revisión cuando la respuesta es PENDING', () => {
      componente.newComment = 'Hola';
      componente.authorName = 'María';

      componente.onSubmit();
      http.expectOne(base).flush({ success: true, data: comentario({ status: 'PENDING' }) });
      http.expectOne(r => r.url === base).flush({ success: true, data: [] });

      expect(componente.pendingNotice()).toBe(true);
      expect(componente.newComment).toBe('');
    });
  });

  describe('envío como usuario registrado', () => {
    beforeEach(() => sesion(true));

    it('no manda los campos de invitado', () => {
      componente.newComment = 'Hola';

      componente.onSubmit();

      const req = http.expectOne(base);
      expect(req.request.body.authorName).toBeUndefined();
      expect(req.request.body.website).toBeUndefined();
      req.flush({ success: true, data: comentario({ status: 'APPROVED' }) });
      http.expectOne(r => r.url === base).flush({ success: true, data: [] });
    });

    it('no muestra aviso de revisión si se publicó al instante', () => {
      componente.newComment = 'Hola';

      componente.onSubmit();
      http.expectOne(base).flush({ success: true, data: comentario({ status: 'APPROVED' }) });
      http.expectOne(r => r.url === base).flush({ success: true, data: [] });

      expect(componente.pendingNotice()).toBe(false);
    });

    it('no envía nada si el contenido está vacío', () => {
      componente.newComment = '   ';
      componente.onSubmit();
      http.expectNone(base);
    });
  });

  describe('moderación', () => {
    it('reenvía el estado destino que pidió el componente hijo', () => {
      sesion(true, true);

      componente.onModerateRequested({ comment: comentario({ id: 3 }), status: 'APPROVED' });

      const req = http.expectOne(`${base}/3/moderate`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ status: 'APPROVED' });
      req.flush({ success: true, data: {} });
      http.expectOne(r => r.url === base).flush({ success: true, data: [] });
    });
  });

  describe('contador de pendientes', () => {
    it('cuenta solo los que están en PENDING', () => {
      sesion(true, true);
      componente.loadComments();

      http.expectOne(r => r.url === base).flush({
        success: true,
        data: [
          comentario({ id: 1, status: 'APPROVED' }),
          comentario({ id: 2, status: 'PENDING' }),
          comentario({ id: 3, status: 'PENDING' }),
          comentario({ id: 4, status: 'REJECTED' }),
        ],
      });

      expect(componente.pendingCount()).toBe(2);
    });

    it('es cero cuando no hay ninguno', () => {
      sesion(true, true);
      componente.loadComments();
      http.expectOne(r => r.url === base).flush({ success: true, data: [comentario()] });

      expect(componente.pendingCount()).toBe(0);
    });
  });
});
