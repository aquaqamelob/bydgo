import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

 type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

const PRESET_QUESTIONS = [
  'Czy twoja praca nad Enigmą została dziś właściwie zrozumiana?',
  'Jakie były najważniejsze konsekwencje złamania szyfru?',
  'Czy mogłeś zrobić więcej podczas wojny?',
  'Jak współczesne systemy postrzegają rolę kryptologii?',
];


const PRESET_ANSWERS: Record<string, string> = {
  'Czy twoja praca nad Enigmą została dziś właściwie zrozumiana?':
    'Dziś znacznie lepiej rozumie się znaczenie naszych działań. W końcu dostrzeżono, że przełamanie Enigmy było wynikiem pracy matematycznej, a nie przypadku.',

  'Jakie były najważniejsze konsekwencje złamania szyfru?':
    'Przechwycenie i odczyt szyfrogramów pozwoliło aliantom podejmować decyzje z przewagą wiedzy, skracając wojnę i ratując wiele istnień.',

  'Czy mogłeś zrobić więcej podczas wojny?':
    'Pracowałem w granicach tego, co było możliwe. Ograniczenia techniczne, utrata sprzętu i warunki wojenne nie pozwalały na więcej.',

  'Jak współczesne systemy postrzegają rolę kryptologii?':
    'Kryptologia stała się fundamentem bezpieczeństwa cyfrowego. Widzę, że jej rola tylko rośnie, a metody, które kiedyś stosowałem, stały się początkiem znacznie większej dziedziny.',
};


export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'm1', role: 'assistant', text: 'Jestem Marian Rejewski. Przez lata zajmowałem się łamaniem szyfrów, zwłaszcza Enigmy. Chciałbym sprawdzić, jak współczesne maszyny myślące rozumieją kryptologię i historię naszych działań. Czy możesz mi pomóc odpowiedzieć na kilka pytań?' },
  ]);
  const [isThinking, setIsThinking] = useState(false);

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const sendPreset = async (prompt: string) => {
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text: prompt };
    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);
    // brief think delay before typing
    await delay(500);
    const fullText = PRESET_ANSWERS[prompt] ?? 'Zobaczmy, co możemy zaplanować w okolicy.';
    const msgId = `a-${Date.now() + 1}`;
    // seed empty assistant message to update progressively
    setMessages((prev) => [...prev, { id: msgId, role: 'assistant', text: '' }]);
    setIsThinking(false);
    // token-by-token typing animation
    const tokens = Array.from(fullText);
    for (let i = 0; i < tokens.length; i++) {
      await delay(tokens[i] === ' ' ? 5 : 18); // slightly slower on non-space
      setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, text: fullText.slice(0, i + 1) } : m)));
    }
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View style={[styles.msg, item.role === 'user' ? styles.user : styles.assistant]}>
      <Text style={styles.msgText}>{item.text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
      {isThinking && (
        <View style={styles.thinkingRow}>
          <View style={[styles.msg, styles.assistant]}>
            <Text style={styles.msgText}>Piszę odpowiedź…</Text>
          </View>
        </View>
      )}
      <View style={styles.presetBar}>
        {PRESET_QUESTIONS.map((q) => (
          <TouchableOpacity key={q} style={styles.presetBtn} onPress={() => sendPreset(q)}>
            <Text style={styles.presetText}>{q}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0b' },
  list: { padding: 12 },
  msg: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginVertical: 6,
  },
  user: { alignSelf: 'flex-end', backgroundColor: '#1e88e5' },
  assistant: { alignSelf: 'flex-start', backgroundColor: '#333' },
  msgText: { color: '#fff', fontSize: 14 },
  presetBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#222',
    backgroundColor: '#111',
  },
  thinkingRow: { paddingHorizontal: 12 },
  presetBtn: {
    backgroundColor: '#222',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  presetText: { color: '#9ec4ff', fontSize: 12 },
});
