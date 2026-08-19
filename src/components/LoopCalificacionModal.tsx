import React, { useState } from "react";
import { Star, CheckCircle2, X, MessageSquare, ShieldCheck } from "lucide-react";

interface LoopCalificacionModalProps {
  lawyerName: string;
  lawyerAvatar?: string;
  onClose: () => void;
  onSubmitRating: (rating: number, comment: string) => void;
}

export default function LoopCalificacionModal({
  lawyerName,
  lawyerAvatar,
  onClose,
  onSubmitRating
}: LoopCalificacionModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    onSubmitRating(rating, comment);
    setTimeout(() => {
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 bg-navy/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-gold/40 relative animate-scale-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-navy p-2 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="font-serif text-xl font-bold text-navy">¡Gracias por tu Calificación!</h3>
            <p className="text-xs text-gray-600 leading-relaxed font-light">
              Tu opinión nutre la reputación del abogado en <strong>TuCaso</strong> y ayuda a otros clientes a tomar decisiones informadas.
            </p>
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <span className="bg-gold/20 text-navy font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full inline-block mb-3">
                Loop de Calificación y Reputación
              </span>
              <h3 className="font-serif text-xl font-bold text-navy">
                ¿Cómo fue la atención inicial?
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Califica tu interacción con <strong className="text-navy">{lawyerName}</strong>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Star Rating Picker */}
              <div className="flex items-center justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoverRating || rating)
                          ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                          : "text-gray-300 fill-gray-100"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="text-center text-xs font-bold text-amber-700">
                {rating === 5 && "⭐ Excelente atención y prontitud"}
                {rating === 4 && "⭐ Muy buena asesoría"}
                {rating === 3 && "⭐ Buena atención"}
                {rating === 2 && "⭐ Regular"}
                {rating === 1 && "⭐ Insatisfecho"}
              </div>

              <div>
                <label className="block text-[10px] uppercase text-gray-400 font-bold mb-1">
                  Comentario u opinión (opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe brevemente la cordialidad, puntualidad o conocimientos del abogado..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs focus:outline-none focus:border-gold"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gold hover:bg-navy hover:text-white text-navy font-bold text-xs py-3.5 rounded-xl transition shadow-md flex items-center justify-center gap-2"
              >
                <Star className="w-4 h-4 fill-navy text-navy" /> Registrar Calificación
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
