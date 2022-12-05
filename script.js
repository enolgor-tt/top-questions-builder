class LanguageItem {
  constructor() {
    this.en = '';
    this.de = '';
    this.fr = '';
    this.nl = '';
    this.textBlock = '';
  }
  get title() {
    return this.lines[0] || "";
  }
  get lines() {
    if (this.textBlock.trim() === "") {
      return [];
    }
    return this.textBlock.split("\n").map((line) => line.trim()).filter((line) => line !== "");
  }
  isValid(langs) {
    return this.lines.length === langs.length;
  }
  obj(langs) {
    const lines = this.lines;
    return langs.reduce((agg, lang, idx) => ({...agg, [lang]: lines[idx]}), {});
  }
}

class Question {
  constructor() {
    this.Type = 'RADIO';
    this.Validity = 12;
    this.Question = new LanguageItem();
    this.Unit = new LanguageItem();
    this.Placeholder = new LanguageItem();
    this.Uncertainty = new LanguageItem();
    this.Answers = [new LanguageItem()];
  }
  isValid(langs) {
    return [
      this.Question,
      this.showUnit() ? this.Unit : null,
      this.showPlaceholder() ? this.Placeholder : null,
      this.showUncertainty() ? this.Uncertainty : null,
      ...(this.showAnswers() ? this.Answers : [null]),
    ].filter((item) => item !== null).reduce((prev, curr) => prev && curr.isValid(langs), true);
  }
  showPlaceholder() {
    return this.Type === "NUMERIC" || this.Type === "TEXT";
  }
  showUnit() {
    return this.Type === "NUMERIC";
  }
  showUncertainty() {
    return this.Type === "NUMERIC" || this.Type === "TEXT";
  }
  showAnswers() {
    return this.Type === "RADIO" || this.Type === "CHECKBOX";
  }
  obj(prio, langs) {
    const q = {
      Type: this.Type,
      Priority: (prio + 1)*10,
      Validity: this.Validity,
      Question: this.Question.obj(langs),
    };
    if (this.showPlaceholder()) {
      q.Placeholder = this.Placeholder.obj(langs);
    }
    if (this.showUnit()) {
      q.Unit = this.Unit.obj(langs);
    }
    if (this.showUncertainty()) {
      q.Uncertainty = this.Uncertainty.obj(langs);
    }
    if (this.showAnswers()) {
      q.Answers = this.Answers.map((ans) => ans.obj(langs));
    }
    return q;
  }
}

function app() {
  return {
    questions: [],
    languages: ['en', '', '', ''],
    async init() {
      this.addQuestion();
    },
    addQuestion() {
      const question = new Question();
      this.questions.push(question);
    },
    moveQuestion(dir, idx) {
      switch(dir) {
        case 'up': {
          if (idx > 0) {
            const question = this.questions.splice(idx, 1)[0];
            this.questions.splice(idx - 1, 0, question);
          }
          break;
        }
        case 'down': {
          if (idx < this.questions.length - 1) {
            const question = this.questions.splice(idx, 1)[0];
            this.questions.splice(idx + 1, 0, question);
          }
          break;
        }
      }
    },
    deleteQuestion(idx) {
      if (this.questions.length > 1) {
        this.questions.splice(idx, 1);
      } 
    },
    addAnswer(questionIdx) {
      const answer = new LanguageItem();
      const question = this.questions[questionIdx];
      question.Answers.push(answer);
    },
    moveAnswer(dir, questionIdx, answerIdx) {
      const question = this.questions[questionIdx];
      switch(dir) {
        case 'up': {
          if (answerIdx > 0) {
            const answer = question.Answers.splice(answerIdx, 1)[0];
            question.Answers.splice(answerIdx - 1, 0, answer);
          }
          break;
        }
        case 'down': {
          if (answerIdx < question.Answers.length - 1) {
            const answer = question.Answers.splice(answerIdx, 1)[0];
            question.Answers.splice(answerIdx + 1, 0, answer);
          }
          break;
        }
      }
    },
    deleteAnswer(questionIdx, answerIdx) {
      const question = this.questions[questionIdx];
      if (question.Answers.length > 1) {
        question.Answers.splice(answerIdx, 1);
      } 
    },
    langs() {
      return this.languages.filter((lang) => lang !== '');
    },
    langSelect(idx) {
      return ($event) => {
        this.languages[idx] = $event.target.value;
      };
    },
    isValid() {
      const langs = this.langs();
      return this.questions.reduce((prev, curr) => prev && curr.isValid(langs), true);
    },
    obj() {
      return {
        Questions: this.questions.map((question, idx) => question.obj(idx, this.langs())),
      };
    },
    download(filename) {
      const text = jsyaml.dump(this.obj());
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
      element.setAttribute('download', filename);
    
      element.style.display = 'none';
      document.body.appendChild(element);
    
      element.click();
    
      document.body.removeChild(element);
    }
  };
};

