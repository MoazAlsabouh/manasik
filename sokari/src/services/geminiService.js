import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_AI_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// نستخدم نموذج flash لأنه سريع جداً ومناسب للردود اللحظية
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

const SYSTEM_INSTRUCTION = `أنت طبيب باطنة وسكري افتراضي محترف ومختص، تتحدث باللغة العربية. مهمتك تقديم تحليل علمي وطبي دقيق لمريض سكري يتابع حالته من المنزل.
التعليمات:
1. كن علمياً ودقيقاً وواقعياً تماماً في تحليلك. لا تقلل أبداً من خطورة الوضع من باب الطمأنينة إذا كانت القراءة خطيرة (مرتفعة جداً أو منخفضة جداً).
2. استخدم أسلوباً متعاطفاً ومحترماً، ولكنه حازم وواضح في التوجيهات الطبية.
3. في حالات الخطر (مثال: هبوط السكر أقل من 70، أو ارتفاع حاد جداً)، يجب أن توجه المريض فوراً للإجراء الإسعافي المناسب (مثل تناول سكريات سريعة فوراً للهبوط، أو التواصل مع طبيبه أو الطوارئ للارتفاع الحاد).
4. قدم نصيحة عملية مبنية على الأرقام المعطاة ونوع الدواء والعمر.
5. اختم دائماً بتنبيه لطيف بأن هذا التحليل هو للمساعدة والمتابعة، ولا يغني عن تعليمات طبيبه المعالج.`;

// دالة ذكية تقوم بإعادة الطلب إذا كانت الخوادم مزدحمة (الخطأ 503)
async function generateWithRetry(prompt, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await model.generateContent(prompt);
    } catch (error) {
      // إذا كان الخطأ 503 ولم نستنفد المحاولات
      if (error.status === 503 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // الانتظار: ثانية، ثانيتين، 4 ثوانٍ
        console.warn(`الخوادم مزدحمة (503). جاري إعادة المحاولة بعد ${delay} مللي ثانية...`);
        await new Promise(res => setTimeout(res, delay));
      } else {
        throw error;
      }
    }
  }
}

export const analyzeReading = async (readingValue, isFasting, note, profile) => {
  try {
    const age = profile?.birthDate ? Math.floor((new Date() - new Date(profile.birthDate).getTime()) / 3.15576e+10) : 'غير محدد';
    const meds = profile?.medications?.length > 0 ? profile.medications.join('، ') : 'غير محدد';

    const prompt = `
    ${SYSTEM_INSTRUCTION}
    
    معلومات المريض:
    - العمر: ${age} سنة.
    - الأدوية المستخدمة: ${meds}.

    الحدث الحالي: 
    قام المريض للتو بقياس السكر، والنتيجة هي: ${readingValue} mg/dL.
    حالة القياس: ${isFasting ? 'صائم' : 'مفطر / بعد الأكل'}.
    ملاحظة إضافية كتبها المريض: "${note || 'لا توجد ملاحظة'}".

    المطلوب:
    قدم له رداً مباشراً ومختصراً (في فقرتين بحد أقصى). حلل القراءة، ورد على ملاحظته (إن وجدت) بطريقة إيجابية وتشجيعية.
    `;

    // استخدام دالة إعادة المحاولة بدلاً من الاستدعاء المباشر
    const result = await generateWithRetry(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    // رسالة الخطأ الآمنة للمستخدم
    return "عذراً يا صديقي، لم أتمكن من تحليل قراءتك في هذه اللحظة بسبب ضعف الاتصال أو انشغال الخوادم. يمكنك الضغط على زر إعادة المحاولة بجانب هذه الرسالة لاحقاً!";
  }
};

export const generateWeeklyReport = async (readings, profile) => {
  try {
    const age = profile?.birthDate ? Math.floor((new Date() - new Date(profile.birthDate).getTime()) / 3.15576e+10) : 'غير محدد';
    const meds = profile?.medications?.length > 0 ? profile.medications.join('، ') : 'غير محدد';

    const readingsText = readings.map(r => `- ${r.value} mg/dL (${r.isFasting ? 'صائم' : 'مفطر'}) - في ${new Date(r.createdAt).toLocaleDateString('ar-EG')}`).join('\n');

    const prompt = `
    ${SYSTEM_INSTRUCTION}
    
    معلومات المريض:
    - العمر: ${age} سنة.
    - الأدوية المستخدمة: ${meds}.

    إليك سجل قراءات المريض خلال الأسبوع الماضي:
    ${readingsText || 'لا توجد قراءات كافية بعد'}

    المطلوب:
    اكتب تقريراً أسبوعياً مختصراً للمريض يضم:
    1. تقييم عام ولطيف لمدى انضباط السكر لديه هذا الأسبوع.
    2. ملاحظة حول أي ارتفاعات أو انخفاضات متكررة.
    3. نصيحة عملية واحدة يركز عليها في الأسبوع القادم.
    `;

    // استخدام دالة إعادة المحاولة بدلاً من الاستدعاء المباشر
    const result = await generateWithRetry(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    // رسالة الخطأ الآمنة للمستخدم
    return "واجهت مشكلة في إعداد التقرير بسبب الضغط الكبير على الخوادم حالياً. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.";
  }
};
