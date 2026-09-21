/* oxlint-disable next/no-img-element -- Local file preview and existing product image. */
'use client';
import { useEffect, useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { checkImageFile } from '@/lib/prepare-product-image';

export function ProductImageInput({ currentUrl }: { currentUrl?: string }) {
  const [preview, setPreview] = useState(currentUrl || '');
  const [error, setError] = useState('');
  const objectUrl = useRef('');
  useEffect(() => () => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
  }, []);
  return (
    <div className="store-image-picker">
      <label htmlFor="product-image-file">Foto da peça</label>
      <div className="store-image-picker-body">
        <div className="store-image-preview">
          {preview ? <img src={preview} alt="Prévia da foto da peça" /> : <ImagePlus size={30} strokeWidth={1.3} aria-hidden="true" />}
        </div>
        <div>
          <input
            id="product-image-file"
            name="imageFile"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required={!currentUrl}
            aria-describedby="product-image-help product-image-error"
            aria-invalid={Boolean(error)}
            onChange={(event) => {
              const input = event.currentTarget;
              const file = input.files?.[0];
              if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
              objectUrl.current = '';
              setError('');
              input.setCustomValidity('');
              setPreview(currentUrl || '');
              if (!file) return;
              try {
                checkImageFile(file);
                objectUrl.current = URL.createObjectURL(file);
                setPreview(objectUrl.current);
              } catch (failure) {
                const message = failure instanceof Error ? failure.message : 'Imagem inválida.';
                setError(message);
                input.setCustomValidity(message);
              }
            }}
          />
          <p id="product-image-help" className="store-fine-print">
            Escolha uma foto do celular ou computador. JPG, PNG ou WebP, até 10 MB.
            {currentUrl ? ' Se não escolher outra, a foto atual será mantida.' : ''}
          </p>
          <p className="store-fine-print">A foto será pública na vitrine. Ela é otimizada e enviada ao salvar a peça.</p>
          <p id="product-image-error" role={error ? 'alert' : undefined} className={error ? 'store-error' : undefined}>{error}</p>
        </div>
      </div>
    </div>
  );
}
