import React from 'react';

export default function Questionnaire({ category, answers, setAnswers }) {
  const handleSelect = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const OptionButton = ({ label, isSelected, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2 px-3 rounded-xl border text-sm font-medium transition-all ${
        isSelected
          ? 'bg-primary text-white border-primary shadow-sm'
          : 'bg-white text-secondary border-border-subtle hover:border-primary/30'
      }`}
    >
      {label}
    </button>
  );

  if (category === 'dairy') {
    return (
      <div className="space-y-5 animate-fade-in-up">
        <div>
          <label className="block text-sm font-bold text-primary mb-2">Does it smell sour or off?</label>
          <div className="flex gap-2">
            <OptionButton label="Yes" isSelected={answers.smell === 'yes'} onClick={() => handleSelect('smell', 'yes')} />
            <OptionButton label="No" isSelected={answers.smell === 'no'} onClick={() => handleSelect('smell', 'no')} />
            <OptionButton label="Unsure" isSelected={answers.smell === 'unsure'} onClick={() => handleSelect('smell', 'unsure')} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-primary mb-2">Does it curdle or look lumpy already?</label>
          <div className="flex gap-2">
            <OptionButton label="Yes" isSelected={answers.lumpy === 'yes'} onClick={() => handleSelect('lumpy', 'yes')} />
            <OptionButton label="No" isSelected={answers.lumpy === 'no'} onClick={() => handleSelect('lumpy', 'no')} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div>
        <label className="block text-sm font-bold text-primary mb-2">Any visible mold or dark spotting?</label>
        <div className="flex gap-2">
          <OptionButton label="Yes" isSelected={answers.mold === 'yes'} onClick={() => handleSelect('mold', 'yes')} />
          <OptionButton label="No" isSelected={answers.mold === 'no'} onClick={() => handleSelect('mold', 'no')} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-bold text-primary mb-2">Does texture feel unusually soft/mushy or waxy?</label>
        <div className="flex gap-2">
          <OptionButton label="Yes" isSelected={answers.texture === 'yes'} onClick={() => handleSelect('texture', 'yes')} />
          <OptionButton label="No" isSelected={answers.texture === 'no'} onClick={() => handleSelect('texture', 'no')} />
        </div>
      </div>
    </div>
  );
}
